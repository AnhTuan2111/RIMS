package vn.edu.fpt.swp391.g6.rimsapi.config;

import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import org.springframework.core.annotation.Order;
import java.util.ArrayList;
import java.util.List;


@Component
@Order(1)
@RequiredArgsConstructor
public class TableDatabaseSeeder implements CommandLineRunner
{

    private final RestaurantTableRepository tableRepository;

    @Override
    public void run(String... args) throws Exception
    {
        if (tableRepository.count() == 0)
        {
            List<RestaurantTable> tables = new ArrayList<>();

            // 4 tables of capacity 2 (T01 - T04)
            for (int i = 1; i <= 4; i++)
            {
                tables.add(createTable(String.format("T%02d", i), 2));
            }

            // 6 tables of capacity 4 (T05 - T10)
            for (int i = 5; i <= 10; i++)
            {
                tables.add(createTable(String.format("T%02d", i), 4));
            }

            // 2 tables of capacity 8 (T11 - T12)
            for (int i = 11; i <= 12; i++)
            {
                tables.add(createTable(String.format("T%02d", i), 8));
            }

            tableRepository.saveAll(tables);
        }
    }

    private RestaurantTable createTable(String tableNumber, int capacity)
    {
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        table.setStatus(TableStatus.AVAILABLE);
        return table;
    }
}
