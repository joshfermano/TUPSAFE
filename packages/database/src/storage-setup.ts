import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorageBuckets() {
  console.log('🪣 Setting up Supabase Storage buckets...\n');

  try {
    // Bucket configurations
    const buckets = [
      {
        name: 'pds-submissions',
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
        description: 'PDS (Personal Data Sheet) submission PDFs',
      },
      {
        name: 'saln-submissions',
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
        description: 'SALN submission PDFs',
      },
      {
        name: 'archives',
        public: false,
        fileSizeLimit: null, // No limit for archives
        allowedMimeTypes: ['application/pdf'],
        description: 'Archived submissions',
      },
      {
        name: 'profile-pictures',
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ],
        description: 'User profile pictures/avatars',
      },
      {
        name: 'user-documents',
        public: false,
        fileSizeLimit: 10485760, // 10MB per file
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ],
        description:
          'User uploaded documents (certifications, seminars, trainings, etc.)',
      },
      {
        name: 'job-application-documents',
        public: false,
        fileSizeLimit: 20971520, // 20MB per file (larger for resumes with portfolios)
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ],
        description:
          'Job application documents (resumes, cover letters, certifications, portfolios)',
      },
    ];

    // Create each bucket
    for (const config of buckets) {
      console.log(`📦 Creating bucket: ${config.name}...`);

      const { data: existingBucket, error: checkError } =
        await supabase.storage.getBucket(config.name);

      if (existingBucket) {
        console.log(
          `   ℹ️  Bucket '${config.name}' already exists, skipping...\n`
        );
        continue;
      }

      const { data, error } = await supabase.storage.createBucket(config.name, {
        public: config.public,
        fileSizeLimit: config.fileSizeLimit,
        allowedMimeTypes: config.allowedMimeTypes,
      });

      if (error) {
        console.error(
          `   ❌ Error creating bucket '${config.name}':`,
          error.message
        );
        continue;
      }

      console.log(`   ✓ Successfully created bucket '${config.name}'\n`);
    }

    // Set up storage policies
    console.log('🔐 Setting up storage policies...\n');
    console.log(
      '   ⚠️  Storage policies must be created manually in Supabase Dashboard'
    );
    console.log('   📝 Required policies:\n');

    console.log('   1. PDS Submissions Bucket (pds-submissions):');
    console.log('      - SELECT: Users can read their own files');
    console.log('      - INSERT: Users can upload their own files');
    console.log(
      '      - UPDATE: Users can update their own files (drafts only)'
    );
    console.log(
      '      - DELETE: Users can delete their own files (drafts only)'
    );
    console.log('      - Admin/HR: Full access to all files\n');

    console.log('   2. SALN Submissions Bucket (saln-submissions):');
    console.log('      - SELECT: Users can read their own files');
    console.log('      - INSERT: Users can upload their own files');
    console.log(
      '      - UPDATE: Users can update their own files (drafts only)'
    );
    console.log(
      '      - DELETE: Users can delete their own files (drafts only)'
    );
    console.log('      - Admin/HR: Full access to all files\n');

    console.log('   3. Archives Bucket (archives):');
    console.log('      - SELECT: Admin/HR only');
    console.log('      - INSERT: Admin/HR only');
    console.log('      - UPDATE: Admin only');
    console.log('      - DELETE: Admin only\n');

    console.log('   4. Profile Pictures Bucket (profile-pictures):');
    console.log('      - SELECT: Users can read their own avatar');
    console.log(
      '      - SELECT: All authenticated users can view others avatars'
    );
    console.log('      - INSERT: Users can upload their own avatar');
    console.log('      - UPDATE: Users can update their own avatar');
    console.log('      - DELETE: Users can delete their own avatar');
    console.log('      - Admin: Full access to all avatars\n');

    console.log('   5. User Documents Bucket (user-documents):');
    console.log('      - SELECT: Users can read their own documents');
    console.log('      - SELECT: Admin/HR can view all user documents');
    console.log('      - INSERT: Users can upload their own documents');
    console.log('      - UPDATE: Users can update their own documents');
    console.log('      - DELETE: Users can delete their own documents');
    console.log('      - Admin: Full access to all documents\n');

    console.log('   6. Job Application Documents Bucket (job-application-documents):');
    console.log('      - SELECT: Applicants can read their own documents');
    console.log('      - SELECT: Admin/HR can view all application documents');
    console.log('      - INSERT: Applicants can upload their own documents');
    console.log('      - UPDATE: Applicants can update their own documents');
    console.log('      - DELETE: Applicants can delete their own documents');
    console.log('      - Admin/HR: Full access to all application documents\n');

    console.log('✅ Storage bucket setup completed!\n');
    console.log('📊 Summary:');
    console.log(`   - ${buckets.length} buckets configured`);
    console.log('   - All buckets are private (not publicly accessible)');
    console.log('   - pds-submissions: PDF only, 10MB limit');
    console.log('   - saln-submissions: PDF only, 10MB limit');
    console.log('   - archives: PDF only, no limit');
    console.log('   - profile-pictures: Images only, 5MB limit');
    console.log('   - user-documents: PDF & Images, 10MB limit');
    console.log('   - job-application-documents: PDF, Images & Word docs, 20MB limit\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Go to Supabase Dashboard → Storage → Policies');
    console.log('   2. Create policies for each bucket as described above');
    console.log('   3. Test file upload/download functionality');
    console.log('   4. Verify RLS policies are enforced\n');

    console.log('💡 Example Storage Policies:\n');

    console.log('-- Users can view their own files (PDS/SALN/Documents)');
    console.log('```sql');
    console.log('CREATE POLICY "Users can view own files"');
    console.log('ON storage.objects FOR SELECT TO authenticated');
    console.log('USING (');
    console.log(
      "  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents') AND"
    );
    console.log('  (storage.foldername(name))[1] = auth.uid()::text');
    console.log(');\n');

    console.log('-- Users can view their own profile picture');
    console.log('CREATE POLICY "Users can view own avatar"');
    console.log('ON storage.objects FOR SELECT TO authenticated');
    console.log('USING (');
    console.log("  bucket_id = 'profile-pictures' AND");
    console.log('  (storage.foldername(name))[1] = auth.uid()::text');
    console.log(');\n');

    console.log('-- All authenticated users can view others profile pictures');
    console.log('CREATE POLICY "View all profile pictures"');
    console.log('ON storage.objects FOR SELECT TO authenticated');
    console.log("USING (bucket_id = 'profile-pictures');\n");

    console.log('-- Users can upload their own documents');
    console.log('CREATE POLICY "Users can upload own documents"');
    console.log('ON storage.objects FOR INSERT TO authenticated');
    console.log('WITH CHECK (');
    console.log(
      "  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents', 'profile-pictures', 'job-application-documents') AND"
    );
    console.log('  (storage.foldername(name))[1] = auth.uid()::text');
    console.log(');\n');

    console.log('-- Admins have full access');
    console.log('CREATE POLICY "Admins full access"');
    console.log('ON storage.objects FOR ALL TO authenticated');
    console.log('USING (');
    console.log('  EXISTS (');
    console.log('    SELECT 1 FROM profiles');
    console.log("    WHERE id = auth.uid() AND role IN ('admin', 'hr')");
    console.log('  )');
    console.log(');');
    console.log('```\n');
  } catch (error) {
    console.error('❌ Error setting up storage buckets:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run setup
setupStorageBuckets();
