package vn.edu.fpt.swp391.g6.rimsapi.enums;

public enum TableStatus
{
    AVAILABLE, // bàn trống, có thể đặt bàn hoặc tạo order
    RESERVED, // đồng bộ khi reservation tương ứng đang trong trạng thái WAITING
    SERVING // đang phục vụ, có order trên bàn này
}
