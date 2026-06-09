package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.swp391.g6.rimsapi.config.HomeContentData;
import vn.edu.fpt.swp391.g6.rimsapi.config.HomeContentStore;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateBrandRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateContactRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BrandResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ContactResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.PublicHomeResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.HomeContentService;

import java.io.IOException;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
@RequiredArgsConstructor
public class HomeContentServiceImpl implements HomeContentService
{
    private final HomeContentStore homeContentStore;

    @Override
    public PublicHomeResponse getPublicHome()
    {
        HomeContentData data = loadContent();
        return PublicHomeResponse.builder()
                .brand(toBrandResponse(data))
                .contact(toContactResponse(data))
                .build();
    }

    @Override
    public BrandResponse updateBrand(UpdateBrandRequest request)
    {
        HomeContentData data = loadContent();
        data.setBrandName(request.getBrandName());
        data.setTagline(request.getTagline());
        data.setDescription(request.getDescription());
        data.setHeroImageUrl(request.getHeroImageUrl());
        saveContent(data);
        return toBrandResponse(data);
    }

    @Override
    public ContactResponse updateContact(UpdateContactRequest request)
    {
        HomeContentData data = loadContent();
        data.setAddress(request.getAddress());
        data.setPhone(request.getPhone());
        data.setEmail(request.getEmail());
        data.setOpeningHours(request.getOpeningHours());
        data.setMapUrl(request.getMapUrl());
        saveContent(data);
        return toContactResponse(data);
    }

    private HomeContentData loadContent()
    {
        try
        {
            return homeContentStore.load();
        }
        catch (IOException e)
        {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Cannot load home content", e);
        }
    }

    private void saveContent(HomeContentData data)
    {
        try
        {
            homeContentStore.save(data);
        }
        catch (IOException e)
        {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Cannot save home content", e);
        }
    }

    private BrandResponse toBrandResponse(HomeContentData data)
    {
        return BrandResponse.builder()
                .brandName(data.getBrandName())
                .tagline(data.getTagline())
                .description(data.getDescription())
                .heroImageUrl(data.getHeroImageUrl())
                .build();
    }

    private ContactResponse toContactResponse(HomeContentData data)
    {
        return ContactResponse.builder()
                .address(data.getAddress())
                .phone(data.getPhone())
                .email(data.getEmail())
                .openingHours(data.getOpeningHours())
                .mapUrl(data.getMapUrl())
                .build();
    }
}
