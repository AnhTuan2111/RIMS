package vn.edu.fpt.swp391.g6.rimsapi.enums;

public enum RoleType
{
    ADMIN,
    CHEF,
    WAITER,
    CASHIER,
    CUSTOMER;

    /**
     * Customer là role duy nhất KHÔNG thuộc nhóm nhân viên (staff).
     * Dùng để phân biệt 2 tab "Staff" / "Customer" trong màn hình
     * View list account, và để quyết định các quyền chỉ dành riêng
     * cho Customer (Change password, Forgot password).
     */
    public boolean isCustomer()
    {
        return this == CUSTOMER;
    }

    public boolean isStaff()
    {
        return this != CUSTOMER;
    }
}
