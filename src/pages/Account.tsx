import DashboardLayout from "@/components/DashboardLayout";

const Account = () => {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-foreground">Account Details</h1>
        <p className="text-muted-foreground mt-2">
          Manage business contact information and social media links
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Account;
