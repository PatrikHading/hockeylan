package com.norops.hockeylan;

import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class HockeylanApplicationTests {

	private static final Set<String> EXPECTED_MIGRATION_VERSIONS =
			Set.of("0", "1", "2", "3", "4", "5");

	private static final Set<String> EXPECTED_TABLES =
			Set.of("equipment", "loans");

	private static final Set<String> EXPECTED_CONSTRAINTS = Set.of(
			"equipment_pkey",
			"loans_pkey",
			"fk_loans_equipment",
			"chk_equipment_type_allowed",
			"chk_equipment_serial_number_not_blank",
			"chk_equipment_type_not_blank",
			"chk_loans_borrower_name_not_blank",
			"chk_loans_email_not_blank",
			"chk_loans_phone_number_not_blank"
	);

	private static final Set<String> EXPECTED_INDEXES = Set.of(
			"ux_equipment_serial_number_lower",
			"idx_equipment_available",
			"idx_equipment_type",
			"idx_loans_equipment_id",
			"idx_loans_returned",
			"idx_loans_loan_date",
			"ux_loans_one_active_loan_per_equipment"
	);

	@Container
	@ServiceConnection
	private static final PostgreSQLContainer POSTGRES =
			new PostgreSQLContainer("postgres:17-alpine")
					.withDatabaseName("hockeylan_test")
					.withUsername("hockeylan_test")
					.withPassword("hockeylan_test");

	private final ConfigurableApplicationContext applicationContext;
	private final Environment environment;
	private final DataSource dataSource;
	private final Flyway flyway;
	private final JdbcTemplate jdbcTemplate;
	private final EquipmentRepository equipmentRepository;
	private final LoanRepository loanRepository;

	@Autowired
	HockeylanApplicationTests(
			ConfigurableApplicationContext applicationContext,
			Environment environment,
			DataSource dataSource,
			Flyway flyway,
			JdbcTemplate jdbcTemplate,
			EquipmentRepository equipmentRepository,
			LoanRepository loanRepository
	) {
		this.applicationContext = applicationContext;
		this.environment = environment;
		this.dataSource = dataSource;
		this.flyway = flyway;
		this.jdbcTemplate = jdbcTemplate;
		this.equipmentRepository = equipmentRepository;
		this.loanRepository = loanRepository;
	}

	@BeforeEach
	void cleanApplicationData() {
		loanRepository.deleteAllInBatch();
		equipmentRepository.deleteAllInBatch();
	}

	@Test
	void springContextStartsWithTestProfileAndRequiredBeans() {
		assertThat(applicationContext.isActive()).isTrue();

		assertThat(environment.getActiveProfiles())
				.contains("test");

		assertThat(applicationContext.getBean(DataSource.class))
				.isSameAs(dataSource);

		assertThat(applicationContext.getBean(Flyway.class))
				.isSameAs(flyway);

		assertThat(applicationContext.getBean(EquipmentRepository.class))
				.isSameAs(equipmentRepository);

		assertThat(applicationContext.getBean(LoanRepository.class))
				.isSameAs(loanRepository);
	}

	@Test
	void postgresqlTestcontainerProvidesTheApplicationsDataSource()
			throws SQLException {

		assertThat(POSTGRES.isRunning()).isTrue();

		try (Connection connection = dataSource.getConnection()) {
			assertThat(connection.isValid(5)).isTrue();

			assertThat(connection.getMetaData().getURL())
					.isEqualTo(POSTGRES.getJdbcUrl());

			assertThat(connection.getCatalog())
					.isEqualTo(POSTGRES.getDatabaseName());
		}

		assertThat(POSTGRES.getMappedPort(PostgreSQLContainer.POSTGRESQL_PORT))
				.isNotEqualTo(PostgreSQLContainer.POSTGRESQL_PORT);
	}

	@Test
	void flywayMigratesAnEmptyDatabaseThroughEveryExpectedVersion() {
		MigrationInfo[] appliedMigrations = flyway.info().applied();

		Set<String> appliedVersions = Arrays.stream(appliedMigrations)
				.map(MigrationInfo::getVersion)
				.map(Object::toString)
				.collect(Collectors.toSet());

		assertThat(appliedVersions)
				.containsExactlyInAnyOrderElementsOf(
						EXPECTED_MIGRATION_VERSIONS
				);

		assertThat(appliedMigrations)
				.hasSize(EXPECTED_MIGRATION_VERSIONS.size())
				.allMatch(
						migration ->
								migration.getState() == MigrationState.SUCCESS
				);
	}

	@Test
	void flywayCreatesExpectedApplicationTables() {
		Set<String> actualTables = Set.copyOf(
				jdbcTemplate.queryForList(
						"""
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_type = 'BASE TABLE'
                          AND table_name IN ('equipment', 'loans')
                        """,
						String.class
				)
		);

		assertThat(actualTables)
				.containsExactlyInAnyOrderElementsOf(EXPECTED_TABLES);
	}

	@Test
	void flywayCreatesExpectedConstraints() {
		Set<String> actualConstraints = Set.copyOf(
				jdbcTemplate.queryForList(
						"""
                        SELECT constraint_name
                        FROM information_schema.table_constraints
                        WHERE table_schema = 'public'
                          AND table_name IN ('equipment', 'loans')
                        """,
						String.class
				)
		);

		assertThat(actualConstraints)
				.containsAll(EXPECTED_CONSTRAINTS);
	}

	@Test
	void flywayCreatesExpectedIndexes() {
		Set<String> actualIndexes = Set.copyOf(
				jdbcTemplate.queryForList(
						"""
                        SELECT indexname
                        FROM pg_indexes
                        WHERE schemaname = 'public'
                          AND tablename IN ('equipment', 'loans')
                        """,
						String.class
				)
		);

		assertThat(actualIndexes)
				.containsAll(EXPECTED_INDEXES);
	}

	@Test
	void importantPartialAndFunctionalIndexesHaveExpectedDefinitions() {
		String serialNumberIndexDefinition = findIndexDefinition(
				"ux_equipment_serial_number_lower"
		);

		String activeLoanIndexDefinition = findIndexDefinition(
				"ux_loans_one_active_loan_per_equipment"
		);

		assertThat(normalizeSql(serialNumberIndexDefinition))
				.contains("unique index")
				.contains("lower((serial_number)::text)");

		assertThat(normalizeSql(activeLoanIndexDefinition))
				.contains("unique index")
				.contains("(equipment_id)")
				.contains("where (returned = false)");
	}

	@Test
	void repositoriesPersistEntitiesAgainstTheFlywaySchema() {
		Equipment equipment = new Equipment(
				EquipmentType.HELMET,
				"  integration-001  ",
				" Integration test helmet "
		);

		Equipment savedEquipment =
				equipmentRepository.saveAndFlush(equipment);

		Loan loan = new Loan(
				savedEquipment,
				"  Test Borrower  ",
				"  TEST.BORROWER@EXAMPLE.COM  ",
				"  0701234567  "
		);

		Loan savedLoan = loanRepository.saveAndFlush(loan);

		assertThat(savedEquipment.getId()).isNotNull();
		assertThat(savedEquipment.getVersion()).isNotNull();
		assertThat(savedEquipment.getCreatedDate()).isNotNull();
		assertThat(savedEquipment.getUpdatedDate()).isNotNull();
		assertThat(savedEquipment.getSerialNumber())
				.isEqualTo("INTEGRATION-001");
		assertThat(savedEquipment.getDescription())
				.isEqualTo("Integration test helmet");

		assertThat(savedLoan.getId()).isNotNull();
		assertThat(savedLoan.getVersion()).isNotNull();
		assertThat(savedLoan.getCreatedDate()).isNotNull();
		assertThat(savedLoan.getUpdatedDate()).isNotNull();
		assertThat(savedLoan.getLoanDate()).isNotNull();
		assertThat(savedLoan.getBorrowerName())
				.isEqualTo("Test Borrower");
		assertThat(savedLoan.getEmail())
				.isEqualTo("test.borrower@example.com");
		assertThat(savedLoan.getPhoneNumber())
				.isEqualTo("0701234567");

		assertThat(
				loanRepository.findByEquipmentIdAndReturnedFalse(
						savedEquipment.getId()
				)
		)
				.isPresent()
				.get()
				.extracting(Loan::getId)
				.isEqualTo(savedLoan.getId());
	}

	@Test
	void importantDatabaseConstraintsAreEnforced() {
		jdbcTemplate.update(
				"""
                INSERT INTO equipment (
                    available,
                    created_date,
                    updated_date,
                    serial_number,
                    type,
                    version
                )
                VALUES (
                    true,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    'CONSTRAINT-001',
                    'HELMET',
                    0
                )
                """
		);

		Long equipmentId = jdbcTemplate.queryForObject(
				"""
                SELECT id
                FROM equipment
                WHERE serial_number = 'CONSTRAINT-001'
                """,
				Long.class
		);

		jdbcTemplate.update(
				"""
                INSERT INTO loans (
                    borrower_name,
                    email,
                    loan_date,
                    phone_number,
                    returned,
                    equipment_id,
                    created_date,
                    updated_date,
                    version
                )
                VALUES (
                    'First borrower',
                    'first@example.com',
                    CURRENT_TIMESTAMP,
                    '0700000001',
                    false,
                    ?,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    0
                )
                """,
				equipmentId
		);

		List<String> activeLoanIndexDefinitions =
				jdbcTemplate.queryForList(
						"""
                        SELECT indexdef
                        FROM pg_indexes
                        WHERE schemaname = 'public'
                          AND indexname =
                              'ux_loans_one_active_loan_per_equipment'
                        """,
						String.class
				);

		assertThat(activeLoanIndexDefinitions)
				.hasSize(1)
				.allSatisfy(
						definition ->
								assertThat(normalizeSql(definition))
										.contains("unique index")
										.contains("(equipment_id)")
										.contains("where (returned = false)")
				);
	}

	private String findIndexDefinition(String indexName) {
		return jdbcTemplate.queryForObject(
				"""
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = ?
                """,
				String.class,
				indexName
		);
	}

	private String normalizeSql(String sql) {
		return sql
				.replace("\"", "")
				.replaceAll("\\s+", " ")
				.trim()
				.toLowerCase();
	}
}