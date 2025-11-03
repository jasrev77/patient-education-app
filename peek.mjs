import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: pharm } = await supa.from('pharmacies').select('id,name,slug');
console.log('Pharmacies:', pharm);

const { data: edu } = await supa.from('drug_education').select('id,pharmacy_id,gpi,title');
console.log('Drug education:', edu);

process.exit(0);
