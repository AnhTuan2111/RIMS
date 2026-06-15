package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.TableDetailResponse;

import java.util.List;


public interface WaiterService
{
    List<TableDetailResponse> getAllTables();
}
