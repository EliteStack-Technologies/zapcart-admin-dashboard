import DashboardLayout from "@/components/DashboardLayout";

const Banners = () => {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-foreground">Banners</h1>
        <p className="text-muted-foreground mt-2">
          Manage promotional banners
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Banners;
