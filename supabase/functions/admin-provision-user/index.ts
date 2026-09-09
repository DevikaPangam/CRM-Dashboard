// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This is a Supabase Edge Function for privileged user provisioning.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CORPORATE_DOMAIN = "@rajmudragroup.com";
const VALID_ROLES = [
  "super_admin",
  "bd_director",
  "bd_manager",
  "bd_sr_exec",
  "bd_exec",
  "management_viewer",
  "analyst",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: callerError } = await supabase.auth.getUser(token);
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller profile & admin role
    const { data: callerProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, organization_id, status")
      .eq("id", callerUser.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.status !== "active") {
      return new Response(JSON.stringify({ error: "Forbidden: Inactive or missing profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (callerProfile.role !== "super_admin" && callerProfile.role !== "bd_director") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin privileges required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      full_name,
      email,
      role = "bd_exec",
      department = "Business Development",
      designation = "BD Executive",
      team_id = null,
      manager_id = null,
      organization_id = callerProfile.organization_id,
      provisioning_method = "invite",
      temp_password = "",
    } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail.endsWith(CORPORATE_DOMAIN)) {
      return new Response(
        JSON.stringify({ error: `Corporate email must end with ${CORPORATE_DOMAIN}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-escalation
    if (role === "super_admin" && callerProfile.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Security Policy: Only a Super Administrator can assign super_admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let authUserId: string;

    if (provisioning_method === "password") {
      if (!temp_password || temp_password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: temp_password,
        email_confirm: true,
        user_metadata: { full_name, organization_id, role },
      });
      if (createErr) throw createErr;
      authUserId = created.user.id;
    } else {
      const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
        cleanEmail,
        { data: { full_name, organization_id, role } }
      );
      if (inviteErr) throw inviteErr;
      authUserId = invited.user.id;
    }

    // Upsert profile
    const initialStatus = provisioning_method === "invite" ? "pending_invite" : "active";
    const { data: newProfile, error: insErr } = await supabase
      .from("profiles")
      .upsert({
        id: authUserId,
        organization_id,
        full_name: full_name.trim(),
        email: cleanEmail,
        role,
        department,
        designation,
        team_id,
        manager_id,
        status: initialStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id,
      actor_id: callerProfile.id,
      action: "CREATE_USER",
      entity_type: "user",
      entity_id: authUserId,
      details: {
        created_email: cleanEmail,
        created_name: full_name,
        assigned_role: role,
        provisioning_method,
      },
    });

    return new Response(JSON.stringify({ success: true, user: newProfile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
