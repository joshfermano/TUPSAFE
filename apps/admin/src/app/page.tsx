'use client';

import { ProtectedRoute, useAuth } from '@tupsafe/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAuth={true} requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                SmartGov Admin Portal
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome, {profile?.firstName} {profile?.lastName} |
                Administrator
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage government employees, HR personnel, and system
                  administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Users:</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Today:</span>
                    <span className="font-medium">156</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    Manage Users
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission Oversight</CardTitle>
                <CardDescription>
                  Monitor PDS and SALN submissions across all departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pending Reviews:</span>
                    <span className="text-yellow-600 font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overdue Submissions:</span>
                    <span className="text-red-600 font-medium">5</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    Review Submissions
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system settings, policies, and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Health:</span>
                    <span className="text-green-600 font-medium">
                      Excellent
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Backup:</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    System Settings
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit & Compliance</CardTitle>
                <CardDescription>
                  View audit logs and generate compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compliance Rate:</span>
                    <span className="text-green-600 font-medium">94.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recent Audits:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    View Audit Logs
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Generate reports and analyze system usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reports Generated:</span>
                    <span className="font-medium">47 this month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Data Points:</span>
                    <span className="font-medium">15.2K</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    Generate Report
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archive Management</CardTitle>
                <CardDescription>
                  Manage archived records and long-term storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Archived Records:</span>
                    <span className="font-medium">3,142</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage Used:</span>
                    <span className="font-medium">2.4 GB</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 text-sm font-medium">
                    Manage Archives
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Administrative Activity</CardTitle>
                <CardDescription>
                  Latest system events and administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        New user registered: Maria Santos (HR Department)
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        15 minutes ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        SALN submission approved for Juan Dela Cruz
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        32 minutes ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        System backup completed successfully
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
