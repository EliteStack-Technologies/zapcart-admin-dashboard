import DashboardLayout from "@/components/DashboardLayout";

const Flyers = () => {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-foreground">Flyers</h1>
        <p className="text-muted-foreground mt-2">
          Manage PDF flyers and promotional materials
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Flyers;
