-- Rota Table
CREATE TABLE IF NOT EXISTS public.rotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    shift_date DATE NOT NULL,
    shift_name VARCHAR(255) NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    modified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Holiday Requests Table
CREATE TABLE IF NOT EXISTS public.holiday_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reason TEXT,
    approved_by UUID REFERENCES public.users(id),
    is_deleted BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    modified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
