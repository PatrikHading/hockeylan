package com.norops.hockeylan.controller;

import com.norops.hockeylan.dto.BorrowerAliasResponseDTO;
import com.norops.hockeylan.dto.BorrowerAliasSummaryDTO;
import com.norops.hockeylan.service.BorrowerAliasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(
        "/api/admin/borrower-aliases"
)
@RequiredArgsConstructor
public class BorrowerAliasRestController {

    private final BorrowerAliasService
            borrowerAliasService;

    @GetMapping
    public ResponseEntity<
            List<BorrowerAliasSummaryDTO>
            > getAliases() {
        return ResponseEntity.ok(
                borrowerAliasService
                        .getAliasSummaries()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<
            BorrowerAliasResponseDTO
            > getAlias(
            @PathVariable
            Long id
    ) {
        return ResponseEntity.ok(
                borrowerAliasService
                        .getAlias(id)
        );
    }
}