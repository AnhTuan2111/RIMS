package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.PublicBestSellingDishResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.AdminService;

import java.util.List;

@RestController
@RequestMapping("/rims/public/menu")
@RequiredArgsConstructor
public class PublicMenuController
{
    private final AdminService adminService;

    @GetMapping("/best-selling")
    public List<PublicBestSellingDishResponse> getPublicBestSelling()
    {
        return adminService.getBestSellingReport("WEEK", null)
                .getItems()
                .stream()
                .limit(5)
                .map(item -> new PublicBestSellingDishResponse(
                        item.getRank(),
                        item.getDishName(),
                        item.getImageUrl()))
                .toList();
    }
}