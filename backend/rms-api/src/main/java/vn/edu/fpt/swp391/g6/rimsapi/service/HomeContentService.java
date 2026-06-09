package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateBrandRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.request.UpdateContactRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.BrandResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.ContactResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.PublicHomeResponse;

public interface HomeContentService
{
    PublicHomeResponse getPublicHome();

    BrandResponse updateBrand(UpdateBrandRequest request);

    ContactResponse updateContact(UpdateContactRequest request);
}
