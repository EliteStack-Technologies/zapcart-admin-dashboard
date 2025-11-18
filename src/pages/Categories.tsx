import DashboardLayout from "@/components/DashboardLayout";

const Categories = () => {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-foreground">Categories</h1>
        <p className="text-muted-foreground mt-2">
          Manage product categories
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Categories;
