package vn.edu.fpt.swp391.g6.rimsapi.enums;

public enum ReservationStatus
{
    QUEUED, // đang trong hàng chờ, chưa tới giờ đặt
    WAITING, // trước giờ đặt 30 phút -> sau giờ đặt 15 phút
    COMPLETED, // trong lúc waiting, create order thì waiting -> completed
    CANCELLED // tự hủy nếu quá giờ đặt 15 phút, hoặc hủy bất cứ lúc nào cũng được
}
