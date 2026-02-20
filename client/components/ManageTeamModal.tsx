import React, { useState, useEffect } from 'react';
import { getUsers, addProjectMember, removeProjectMember } from '../services/api';
import { User, Project } from '../types';

interface ManageTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: () => void;
}

export const ManageTeamModal: React.FC<ManageTeamModalProps> = ({ isOpen, onClose, project, onUpdate }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await getUsers();
            setUsers(response.users || []);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (uid: string) => {
        setProcessing(uid);
        try {
            await addProjectMember(project.id!, uid);
            onUpdate(); // Refresh project data
        } catch (error) {
            console.error('Failed to add member', error);
            alert('Failed to add member');
        } finally {
            setProcessing(null);
        }
    };

    const handleRemoveMember = async (uid: string) => {
        setProcessing(uid);
        try {
            await removeProjectMember(project.id!, uid);
            onUpdate();
        } catch (error) {
            console.error('Failed to remove member', error);
            alert('Failed to remove member');
        } finally {
            setProcessing(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Manage Team Members</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading users...</div>
                    ) : (
                        <div className="space-y-4">
                            {users.map(user => {
                                const isMember = project.teamMembers?.includes(user.uid);
                                return (
                                    <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                                {user.displayName?.substring(0, 2).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.displayName || user.email}</div>
                                                <div className="text-xs text-gray-400 capitalize">{user.role} • {user.email}</div>
                                            </div>
                                        </div>

                                        {isMember ? (
                                            <button
                                                onClick={() => handleRemoveMember(user.uid)}
                                                disabled={!!processing}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                                            >
                                                {processing === user.uid ? 'Removing...' : 'Remove'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAddMember(user.uid)}
                                                disabled={!!processing}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {processing === user.uid ? 'Adding...' : 'Add'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
