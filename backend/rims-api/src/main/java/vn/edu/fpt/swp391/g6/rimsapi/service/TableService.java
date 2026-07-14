package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.table.TableDetailResponse;
import java.util.List;

public interface TableService
{
    List<TableDetailResponse> getAllTables();
}
