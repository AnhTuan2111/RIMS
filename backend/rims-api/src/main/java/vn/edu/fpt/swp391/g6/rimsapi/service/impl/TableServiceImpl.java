package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.TableService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService
{
    private final RestaurantTableRepository restaurantTableRepository;

    @Override
    public List<TableDetailResponse> getAllTables()
    {
        List<RestaurantTable> tables = restaurantTableRepository.findAll();
        List<TableDetailResponse> responses = new ArrayList<>();
        for (RestaurantTable t : tables)
        {
            responses.add(TableDetailResponse.builder()
                    .tableId(t.getId())
                    .tableNumber(t.getTableNumber())
                    .capacity(t.getCapacity())
                    .status(t.getStatus())
                    .build());
        }
        return responses;
    }
}
