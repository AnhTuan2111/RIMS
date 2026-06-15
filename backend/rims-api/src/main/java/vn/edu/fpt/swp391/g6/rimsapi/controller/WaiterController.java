package vn.edu.fpt.swp391.g6.rimsapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.TableDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.service.WaiterService;

import java.util.List;


@RestController
@RequestMapping("/rims/waiter")
@RequiredArgsConstructor
public class WaiterController
{
    private final WaiterService waiterService;

    @GetMapping("tables")
    public ResponseEntity<List<TableDetailResponse>> getWaiterTables()
    {
        return ResponseEntity.ok(waiterService.getAllTables());
    }
}
