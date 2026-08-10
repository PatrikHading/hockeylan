package com.norops.hockeylan.repository;

import com.norops.hockeylan.model.BorrowerAlias;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BorrowerAliasRepository
        extends JpaRepository<
        BorrowerAlias,
        Long
        > {

    boolean existsByAliasNameIgnoreCase(
            String aliasName
    );

    List<BorrowerAlias>
    findAllByOrderByAliasNameAsc();
}