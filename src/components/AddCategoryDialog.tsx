import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addCategory, updateCategory } from "@/services/category";

interface AddCategoryDialogProps {
  open: boolean;
  setCategories: any;
  onOpenChange: (open: boolean) => void;
  editingCategory?: {
    _id: number;
    name: string;
    productCount: number;
  };
}

const AddCategoryDialog = ({
  open,
  onOpenChange,
  setCategories,
  editingCategory,
}: AddCategoryDialogProps) => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: editingCategory?.name || "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        // UPDATE MODE
        const response = await updateCategory(String(editingCategory._id), { name: data.name });
        const updatedCategory = response?.data || response;

        if (setCategories) {
          setCategories((prev: any[]) =>
            prev.map((c) =>
              c._id === editingCategory._id ? updatedCategory : c
            )
          );
        }

        toast({
          title: "Category updated",
          description: "Your category has been successfully updated.",
        });
      } else {
        // CREATE MODE
        const response = await addCategory({ name: data.name });
        const newCategory = response?.data || response;

        if (setCategories) {
          setCategories((prev: any[]) => [...prev, newCategory]);
        }

        toast({
          title: "Category created",
          description: "Your category has been successfully added.",
        });
      }

      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setValue("name", editingCategory?.name);
  }, [editingCategory]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? `Edit category #${editingCategory._id}. Update the name and other details.`
              : "Create a new product category with a custom color."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name*</Label>
              <Input
                id="name"
                placeholder="Beverages"
                {...register("name", { required: "Category name is required" })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? "Update Category" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
