package vn.edu.fpt.swp391.g6.rimsapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateBrandRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateContactRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BrandResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ContactResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.PublicHomeResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.HomeContentService;

@RestController
@RequestMapping("/api/admin/home-content")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHomeContentController
{
    private final HomeContentService homeContentService;

    @GetMapping
    public PublicHomeResponse getHomeContent()
    {
        return homeContentService.getPublicHome();
    }

    @PutMapping("/brand")
    public BrandResponse updateBrand(@Valid @RequestBody UpdateBrandRequest request)
    {
        return homeContentService.updateBrand(request);
    }

    @PutMapping("/contact")
    public ContactResponse updateContact(@Valid @RequestBody UpdateContactRequest request)
    {
        return homeContentService.updateContact(request);
    }
}
