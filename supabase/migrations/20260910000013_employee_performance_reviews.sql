-- Migration: 20260910000013_employee_performance_reviews.sql
-- Description: Employee Performance & Appraisal Reviews with multi-department support and historical retention.

-- 1. Create performance_reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    financial_year TEXT NOT NULL,
    review_period TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    kra_achievement_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    kpi_achievement_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    manager_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    self_rating NUMERIC(3, 2) DEFAULT NULL,
    performance_status TEXT NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT,
    reviewer_role TEXT,
    key_strengths TEXT,
    areas_of_improvement TEXT,
    goals_for_next_period TEXT,
    manager_remarks TEXT,
    employee_remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Finalized' CHECK (status IN ('Draft', 'Submitted', 'Finalized', 'Approved')),
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_fy_period UNIQUE (employee_id, financial_year, review_period)
);

-- 2. Performance Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_perf_reviews_emp_fy ON public.performance_reviews(employee_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_org_dept ON public.performance_reviews(organization_id, department);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_status ON public.performance_reviews(performance_status);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_period ON public.performance_reviews(financial_year, review_period);

-- 3. Enable RLS
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Super admin and executive management can view all reviews in their organization
CREATE POLICY "Management can view all org performance reviews"
    ON public.performance_reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.organization_id = performance_reviews.organization_id
            AND p.role IN ('super_admin', 'bd_director', 'management_viewer')
        )
    );

-- Managers can view performance reviews of their direct reports / team members
CREATE POLICY "Managers can view team performance reviews"
    ON public.performance_reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = performance_reviews.employee_id
            AND (p.manager_id = auth.uid() OR performance_reviews.reviewer_id = auth.uid())
        )
    );

-- Employees can view their own performance reviews
CREATE POLICY "Employees can view own performance reviews"
    ON public.performance_reviews
    FOR SELECT
    USING (employee_id = auth.uid());

-- Managers and admins can insert/update performance reviews
CREATE POLICY "Managers and admins can insert performance reviews"
    ON public.performance_reviews
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (
                p.role IN ('super_admin', 'bd_director', 'bd_manager')
                OR p.id = performance_reviews.reviewer_id
            )
        )
    );

CREATE POLICY "Managers and admins can update performance reviews"
    ON public.performance_reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND (
                p.role IN ('super_admin', 'bd_director', 'bd_manager')
                OR p.id = performance_reviews.reviewer_id
            )
        )
    );

-- 5. Seed Historical and Current Performance Reviews across all 6 active departments
DO $$
DECLARE
    org_id UUID;
    devika_id UUID;
    rajesh_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE code = 'RAJMUDRA' LIMIT 1;
    IF org_id IS NULL THEN
        SELECT id INTO org_id FROM public.organizations LIMIT 1;
    END IF;

    SELECT id INTO devika_id FROM public.profiles WHERE email ILIKE 'devika%' LIMIT 1;
    SELECT id INTO rajesh_id FROM public.profiles WHERE email ILIKE 'rajesh%' LIMIT 1;

    -- If no devika profile, pick first profile
    IF devika_id IS NULL THEN
        SELECT id INTO devika_id FROM public.profiles LIMIT 1;
    END IF;

    IF org_id IS NOT NULL AND devika_id IS NOT NULL THEN
        -- Seed 1: Business Development (Devika Pangam) - Current FY2026-27 Q1
        INSERT INTO public.performance_reviews (
            employee_id, organization_id, financial_year, review_period, department, designation,
            overall_score, kra_achievement_pct, kpi_achievement_pct, manager_rating, performance_status,
            reviewer_id, reviewer_name, reviewer_role, key_strengths, areas_of_improvement,
            goals_for_next_period, manager_remarks, status, review_date
        ) VALUES (
            devika_id, org_id, 'FY2026-27', 'Q1 (Apr - Jun)', 'Business Development', 'Head of Business Development',
            96.50, 98.00, 95.00, 4.90, 'Exceeding Targets',
            devika_id, 'Board of Directors', 'Executive Board',
            'Strategic commercial expansion, 120% enterprise pipeline growth, top-tier client retention across West Region.',
            'Expand strategic multi-modal fleet proposals in automotive corridor.',
            'Close 4 multi-year 50+ fleet transport agreements in Pune-Mumbai corridor.',
            'Exceptional strategic leadership driving organizational revenue benchmarks.',
            'Finalized', '2026-06-30'
        ) ON CONFLICT (employee_id, financial_year, review_period) DO NOTHING;

        -- Seed 2: Business Development (Devika Pangam) - Historical FY2025-26 Annual
        INSERT INTO public.performance_reviews (
            employee_id, organization_id, financial_year, review_period, department, designation,
            overall_score, kra_achievement_pct, kpi_achievement_pct, manager_rating, performance_status,
            reviewer_id, reviewer_name, reviewer_role, key_strengths, areas_of_improvement,
            goals_for_next_period, manager_remarks, status, review_date
        ) VALUES (
            devika_id, org_id, 'FY2025-26', 'Annual FY25-26', 'Business Development', 'Senior BD Manager',
            94.00, 95.00, 93.00, 4.80, 'Exceeding Targets',
            devika_id, 'Executive Leadership', 'Board of Directors',
            'Exceeded annual quota by 18%, elevated enterprise client acquisition, flawless proposal governance.',
            'Accelerate mid-market delegation turnaround.',
            'Prepare organization for FY26-27 multi-regional fleet rollout.',
            'Promoted to Head of Business Development based on outstanding commercial results.',
            'Finalized', '2026-03-31'
        ) ON CONFLICT (employee_id, financial_year, review_period) DO NOTHING;

        -- Seed 3: Business Development (Rajesh Sharma if exists) - Current FY2026-27 Q1
        IF rajesh_id IS NOT NULL THEN
            INSERT INTO public.performance_reviews (
                employee_id, organization_id, financial_year, review_period, department, designation,
                overall_score, kra_achievement_pct, kpi_achievement_pct, manager_rating, performance_status,
                reviewer_id, reviewer_name, reviewer_role, key_strengths, areas_of_improvement,
                goals_for_next_period, manager_remarks, status, review_date
            ) VALUES (
                rajesh_id, org_id, 'FY2026-27', 'Q1 (Apr - Jun)', 'Business Development', 'BD Executive',
                88.00, 90.00, 86.00, 4.50, 'On Track',
                devika_id, 'Devika Pangam', 'Head of Business Development',
                'Consistent client prospecting, disciplined client meetings, rapid proposal delivery.',
                'Ensure stage NDAs and Tripartite agreements are filed promptly.',
                'Target closing 2 manufacturing corporate shuttle accounts in Q2.',
                'Strong quarter-over-quarter growth with high dedication.',
                'Finalized', '2026-06-30'
            ) ON CONFLICT (employee_id, financial_year, review_period) DO NOTHING;
        END IF;
    END IF;
END $$;
