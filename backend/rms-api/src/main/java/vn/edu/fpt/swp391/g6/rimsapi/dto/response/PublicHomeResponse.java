package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicHomeResponse
{
    private BrandResponse brand;
    private ContactResponse contact;
}
