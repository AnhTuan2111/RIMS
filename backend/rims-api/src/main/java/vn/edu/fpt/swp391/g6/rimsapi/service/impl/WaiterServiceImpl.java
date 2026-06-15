package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.service.WaiterService;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class WaiterServiceImpl implements WaiterService
{
    private final RestaurantTableRepository restaurantTableRepository;

    @Override
    public List<TableDetailResponse> getAllTables()
    {
        List<RestaurantTable> tables = restaurantTableRepository.findAll();
        List<TableDetailResponse> tableDetailResponses = new ArrayList<>();
        for (RestaurantTable table : tables) {
            tableDetailResponses.add(
                    TableDetailResponse.builder()
                            .tableId(table.getId())
                            .tableNumber(table.getTableNumber())
                            .capacity(table.getCapacity())
                            .status(table.getStatus())
                            .build());
        }
        return tableDetailResponses;
    }

}