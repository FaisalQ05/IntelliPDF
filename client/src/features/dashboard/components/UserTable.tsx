import { DataTable } from "@/components/table/DataTable"
import { useGetUsers } from "../hooks/useUsers"
import { userColumns } from "../columns/user.columns"
import type { User } from "@/features/auth/types/user.types"

const UserTable = () => {
  const { users, isLoading } = useGetUsers()

  return (
    <DataTable<User>
      data={users}
      columns={userColumns}
      isLoading={isLoading}
      emptyMessage="No users found"
      emptySubtext="There are no users registered in the system."
    />
  )
}

export default UserTable
