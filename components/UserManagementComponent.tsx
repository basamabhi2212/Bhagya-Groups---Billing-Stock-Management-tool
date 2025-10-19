import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button, Input, Modal, Card } from './common';
import { PlusIcon, EditIcon, TrashIcon } from './icons';

interface UserManagementComponentProps {
  users: User[];
  onSave: (users: User[]) => void;
  isFirstUserSetup?: boolean;
}

const emptyUser: Omit<User, 'id'> = {
  name: '',
  username: '',
  password: '',
  role: UserRole.EXECUTIVE,
};

export const UserManagementComponent: React.FC<UserManagementComponentProps> = ({ users, onSave, isFirstUserSetup = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(isFirstUserSetup);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(isFirstUserSetup ? {...emptyUser, role: UserRole.ADMIN} : null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleAddNew = () => {
    setCurrentUser(emptyUser);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setCurrentUser({ ...user, password: '' }); // Don't show password on edit
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      if (users.length <= 1) {
          alert("You cannot delete the last user.");
          return;
      }
      onSave(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSave = () => {
    if (!currentUser || !currentUser.name || !currentUser.username || (!currentUser.id && !currentUser.password) || !currentUser.role) {
      alert('Please fill all required fields.');
      return;
    }

    let updatedUsers;
    if (currentUser.id) { // Editing
      updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
          const updatedUser = { ...u, ...currentUser };
          if (!currentUser.password) { // If password field was left blank, keep old password
            updatedUser.password = u.password;
          }
          return updatedUser;
        }
        return u;
      });
    } else { // Adding
      const newUser: User = {
        ...currentUser,
        id: `user_${new Date().getTime()}`,
      } as User;
      updatedUsers = [...users, newUser];
    }
    
    onSave(updatedUsers);
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const title = currentUser?.id ? 'Edit User' : (isFirstUserSetup ? 'Create Admin User' : 'Add New User');

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Users</h1>
          {!isFirstUserSetup && (
            <Button onClick={handleAddNew} className="flex items-center space-x-2">
              <PlusIcon />
              <span>Add User</span>
            </Button>
          )}
        </div>
        
        {isFirstUserSetup && (
             <p className="text-center p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-md text-blue-800 dark:text-blue-200">
                No users found. Please create the first administrator account to continue.
            </p>
        )}

        {!isFirstUserSetup && (
            <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
                <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">Actions</th>
                </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200">
                {users.map(user => (
                    <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">{user.username}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                        <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                        <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {users.length === 0 && <p className="text-center py-4 text-gray-500">No users found.</p>}
            </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => !isFirstUserSetup && setIsModalOpen(false)} title={title}>
        <div className="space-y-4">
          <Input label="Full Name" type="text" value={currentUser?.name || ''} onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })} required />
          <Input label="Username" type="text" value={currentUser?.username || ''} onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })} required />
          <Input label="Password" type="password" placeholder={currentUser?.id ? 'Leave blank to keep unchanged' : ''} value={currentUser?.password || ''} onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })} required={!currentUser?.id} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select
                value={currentUser?.role || ''}
                onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as UserRole })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={isFirstUserSetup}
            >
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            {!isFirstUserSetup && <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>}
            <Button onClick={handleSave}>Save User</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Deletion">
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};