# API Integration Guide for Edit Profile Page

## Overview

This guide provides step-by-step instructions for integrating the edit profile page with your backend API.

## Required API Endpoints

### 1. Fetch Profile Data

**Endpoint**: `GET /api/profile/:id`

**Headers**:
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

**Response** (200 OK):
```typescript
{
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  employeeId: string;
  departmentId: string;
  positionId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

### 2. Update Profile Data

**Endpoint**: `PUT /api/profile/:id`

**Headers**:
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

**Request Body**:
```typescript
{
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  departmentId: string;
  positionId: string;
  avatarUrl?: string;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  message: "Profile updated successfully";
  data: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    employeeId: string;
    departmentId: string;
    positionId: string;
    avatarUrl?: string;
    updatedAt: string;
  }
}
```

### 3. Upload Avatar

**Endpoint**: `POST /api/upload/avatar`

**Headers**:
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'multipart/form-data'
}
```

**Request Body** (FormData):
```typescript
{
  file: File;
  userId: string;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  url: string; // Public URL to the uploaded image
  message: "Avatar uploaded successfully";
}
```

### 4. Fetch Departments

**Endpoint**: `GET /api/departments?active=true`

**Headers**:
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

**Response** (200 OK):
```typescript
{
  data: Array<{
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }>;
  total: number;
}
```

### 5. Fetch Positions

**Endpoint**: `GET /api/positions?active=true`

**Headers**:
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

**Response** (200 OK):
```typescript
{
  data: Array<{
    id: string;
    title: string;
    gradeLevel: number;
    isActive: boolean;
  }>;
  total: number;
}
```

## Implementation Steps

### Step 1: Create API Client Functions

Create `/src/lib/api/profile.ts`:

```typescript
import { createClient } from '@/lib/supabase/client';
import type { EditProfileFormData } from '@/lib/validations/profile';

const supabase = createClient();

/**
 * Fetch user profile by ID
 */
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      department:departments(*),
      position:positions(*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: EditProfileFormData
) {
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({
      first_name: data.firstName,
      middle_name: data.middleName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      department_id: data.departmentId,
      position_id: data.positionId,
      avatar_url: data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(userId: string, file: File) {
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Fetch all active departments
 */
export async function fetchDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Fetch all active positions
 */
export async function fetchPositions() {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (error) throw error;
  return data;
}
```

### Step 2: Integrate with React Query

Update `/src/app/dashboard/profile/edit/[id]/page.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  fetchDepartments,
  fetchPositions,
} from '@/lib/api/profile';

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', params.id],
    queryFn: () => fetchProfile(params.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch positions
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditProfileFormData) =>
      updateProfile(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', params.id] });
      toast.success('Profile updated successfully!');
      router.push('/dashboard/profile');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    },
  });

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(params.id, file),
  });

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const avatarUrl = await avatarMutation.mutateAsync(avatarFile);
        data.avatarUrl = avatarUrl;
      }

      // Update profile
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  // Replace MOCK_DEPARTMENTS with actual data
  // const MOCK_DEPARTMENTS = departments;
  // const MOCK_POSITIONS = positions;

  // ... rest of component
}
```

### Step 3: Add Error Handling

```typescript
// Add error boundary
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-slate-600">{error.message}</p>
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </div>
    </div>
  );
}

// Wrap component
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <EditProfilePage {...props} />
</ErrorBoundary>
```

### Step 4: Add Optimistic Updates (Optional)

```typescript
const updateMutation = useMutation({
  mutationFn: (data: EditProfileFormData) =>
    updateProfile(params.id, data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['profile', params.id] });

    // Snapshot previous value
    const previousProfile = queryClient.getQueryData(['profile', params.id]);

    // Optimistically update
    queryClient.setQueryData(['profile', params.id], (old: any) => ({
      ...old,
      ...newData,
    }));

    return { previousProfile };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['profile', params.id],
      context?.previousProfile
    );
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['profile', params.id] });
  },
});
```

## Database Schema Requirements

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50),
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  department_id UUID NOT NULL REFERENCES departments(id),
  position_id UUID NOT NULL REFERENCES positions(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_position ON profiles(position_id);
CREATE INDEX idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view and update all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Storage Bucket Configuration

```sql
-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true);

-- RLS Policies for storage
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.filename(name))
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.filename(name))
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
```

## Testing Checklist

- [ ] Profile data loads correctly
- [ ] Form validation works
- [ ] Avatar upload succeeds
- [ ] Profile update succeeds
- [ ] Error handling works
- [ ] Authorization checks work
- [ ] Loading states display
- [ ] Toast notifications appear
- [ ] Optimistic updates work (if implemented)
- [ ] Cache invalidation works
- [ ] Redirects to profile page after save

## Troubleshooting

### Issue: CORS errors
**Solution**: Configure CORS in Supabase dashboard or add CORS headers to API responses

### Issue: 401 Unauthorized
**Solution**: Check JWT token is valid and included in Authorization header

### Issue: File upload fails
**Solution**: Verify storage bucket exists and RLS policies allow uploads

### Issue: Profile not updating
**Solution**: Check RLS policies allow updates for the user

### Issue: Cache not invalidating
**Solution**: Ensure queryKey matches between query and invalidation

## Security Best Practices

1. **Validate on server**: Always validate input on the server side
2. **Sanitize inputs**: Prevent SQL injection and XSS
3. **Check permissions**: Verify user can edit the profile
4. **Rate limiting**: Implement rate limits on API endpoints
5. **File validation**: Validate file type and size on server
6. **Secure URLs**: Use signed URLs for private files
7. **Audit logging**: Log all profile changes for compliance

## Performance Tips

1. **Prefetch data**: Prefetch departments and positions on page load
2. **Debounce uploads**: Debounce avatar upload to prevent spam
3. **Cache aggressively**: Cache departments and positions for 10+ minutes
4. **Lazy load**: Lazy load heavy components
5. **Optimize images**: Compress and resize avatars on upload
6. **Use CDN**: Serve avatars from CDN for faster loading

---

**Ready to integrate?** Follow steps 1-4 above and test thoroughly!
