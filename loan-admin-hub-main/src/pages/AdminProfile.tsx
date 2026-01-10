import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Save, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AdminProfileData {
    id: string;
    customer_id: string;
    email: string;
    mobile_number: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
}

export default function AdminProfile() {
    const [profile, setProfile] = useState<AdminProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getProfile();
            setProfile(data);
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to load profile data.',
                variant: 'destructive',
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminApi.updateProfile(formData);
            toast({
                title: 'Success',
                description: 'Profile updated successfully.',
            });
            setEditMode(false);
            fetchProfile();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update profile.',
                variant: 'destructive',
            });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Page Header */}
                <div className="p-6 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl border border-teal-500/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-500/30">
                            <User className="h-6 w-6 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
                            <p className="text-gray-400">Manage your account settings</p>
                        </div>
                    </div>
                </div>

                {/* Profile Card */}
                <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-teal-400" />
                            Account Information
                        </CardTitle>
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {profile?.role?.toUpperCase()}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Read-only Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Officer ID</label>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white font-mono text-sm">
                                    {profile?.customer_id || 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Mobile Number
                                </label>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white">
                                    {profile?.mobile_number}
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">First Name</label>
                                {editMode ? (
                                    <Input
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="bg-gray-900/50 border-gray-700 text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white">
                                        {profile?.first_name || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Last Name</label>
                                {editMode ? (
                                    <Input
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="bg-gray-900/50 border-gray-700 text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white">
                                        {profile?.last_name || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email Address
                            </label>
                            {editMode ? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-gray-900/50 border-gray-700 text-white"
                                />
                            ) : (
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white">
                                    {profile?.email || 'Not set'}
                                </div>
                            )}
                        </div>

                        {/* Member Since */}
                        <div className="pt-4 border-t border-gray-700">
                            <p className="text-sm text-gray-500">
                                Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            {editMode ? (
                                <>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                    <Button
                                        onClick={() => setEditMode(false)}
                                        variant="outline"
                                        className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => setEditMode(true)}
                                    className="w-full bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
