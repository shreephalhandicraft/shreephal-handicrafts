import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { UserForm } from "../forms/UserForm";
import { useToast } from "@/hooks/use-toast";

const initialUsers = [
  {
    id: 1,
    name: "John Admin",
    email: "john@admin.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-20",
  },
  {
    id: 2,
    name: "Sarah Manager",
    email: "sarah@company.com",
    role: "manager",
    status: "active",
    lastLogin: "2024-01-19",
  },
  {
    id: 3,
    name: "Mike Staff",
    email: "mike@company.com",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-18",
  },
  {
    id: 4,
    name: "Emily Worker",
    email: "emily@company.com",
    role: "staff",
    status: "inactive",
    lastLogin: "2024-01-15",
  },
];

export function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState();
  const [deleteUser, setDeleteUser] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newUser = {
      ...data,
      id: Math.max(...users.map((u) => u.id)) + 1,
      lastLogin: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, newUser]);
    setIsFormOpen(false);
    toast({ title: "User created successfully" });
  };

  const handleEdit = (data) => {
    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u))
      );
      setEditingUser(undefined);
      toast({ title: "User updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteUser) {
      setUsers(users.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(undefined);
      toast({ title: "User deleted successfully" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Users List</CardTitle>
          <CardDescription>
            You have {users.length} users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-surface-light rounded-lg border border-border"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.lastLogin}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={
                      user.role === "admin"
                        ? "default"
                        : user.role === "manager"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }
                  >
                    {user.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen || !!editingUser}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingUser(undefined);
        }}
      >
        <DialogContent>
          <UserForm
            user={editingUser}
            onSubmit={editingUser ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingUser(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteUser}
        onOpenChange={() => setDeleteUser(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteUser?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
