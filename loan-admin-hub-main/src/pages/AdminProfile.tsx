import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Save, Loader2, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AdminProfileData {
    id: string;
    customer_id: string;
    email: string;
    mobile_number: string;
    first_name: string;
    last_name: string;
    department?: string;
    designation?: string;
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

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    // PIN change state
    const [pinForm, setPinForm] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: ''
    });
    const [changingPin, setChangingPin] = useState(false);

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

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match.',
                variant: 'destructive',
            });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters.',
                variant: 'destructive',
            });
            return;
        }

        setChangingPassword(true);
        try {
            await adminApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            toast({
                title: 'Success',
                description: 'Password changed successfully.',
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to change password.',
                variant: 'destructive',
            });
        }
        setChangingPassword(false);
    };

    const handleChangePin = async () => {
        if (pinForm.newPin !== pinForm.confirmPin) {
            toast({
                title: 'Error',
                description: 'New PINs do not match.',
                variant: 'destructive',
            });
            return;
        }
        if (pinForm.newPin.length !== 6 || !/^\d+$/.test(pinForm.newPin)) {
            toast({
                title: 'Error',
                description: 'PIN must be exactly 6 digits.',
                variant: 'destructive',
            });
            return;
        }

        setChangingPin(true);
        try {
            await adminApi.changePin(pinForm.currentPin, pinForm.newPin);
            toast({
                title: 'Success',
                description: 'PIN changed successfully.',
            });
            setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to change PIN.',
                variant: 'destructive',
            });
        }
        setChangingPin(false);
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
                            <p className="text-gray-400">Manage your account and security settings</p>
                        </div>
                    </div>
                </div>

                {/* Profile Card */}
                <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-teal-400" />
                            Account Information
                        </CardTitle>
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {profile?.designation || profile?.role?.toUpperCase()}
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
                                <label className="text-sm text-gray-400">Department</label>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-white">
                                    {profile?.department || 'Loan Operations'}
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

                {/* Change Password Card */}
                <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-orange-400" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Current Password</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="bg-gray-900/50 border-gray-700 text-white pr-10"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">New Password</label>
                                <Input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="bg-gray-900/50 border-gray-700 text-white"
                                    placeholder="New password"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Confirm Password</label>
                                <Input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="bg-gray-900/50 border-gray-700 text-white"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                            className="w-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
                        >
                            {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                            Change Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Change PIN Card */}
                <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Key className="h-5 w-5 text-purple-400" />
                            Change Security PIN
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Current PIN (6 digits)</label>
                            <Input
                                type="password"
                                maxLength={6}
                                value={pinForm.currentPin}
                                onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                                className="bg-gray-900/50 border-gray-700 text-white tracking-widest"
                                placeholder="••••••"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">New PIN</label>
                                <Input
                                    type="password"
                                    maxLength={6}
                                    value={pinForm.newPin}
                                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                                    className="bg-gray-900/50 border-gray-700 text-white tracking-widest"
                                    placeholder="••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Confirm PIN</label>
                                <Input
                                    type="password"
                                    maxLength={6}
                                    value={pinForm.confirmPin}
                                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                                    className="bg-gray-900/50 border-gray-700 text-white tracking-widest"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleChangePin}
                            disabled={changingPin || !pinForm.currentPin || !pinForm.newPin}
                            className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                        >
                            {changingPin ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                            Change PIN
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

