package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.PublicHomeResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.HomeContentService;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicHomeController
{
    private final HomeContentService homeContentService;

    @GetMapping("/home")
    public PublicHomeResponse getHome()
    {
        return homeContentService.getPublicHome();
    }
}
