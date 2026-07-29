package com.norops.hockeylan;

import com.norops.hockeylan.model.AgeCategory;
import com.norops.hockeylan.model.Equipment;
import com.norops.hockeylan.model.EquipmentCondition;
import com.norops.hockeylan.model.EquipmentType;
import com.norops.hockeylan.model.Loan;
import com.norops.hockeylan.repository.EquipmentRepository;
import com.norops.hockeylan.repository.LoanRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class HockeylanApplicationTests {

	private static final Set<String>
			EXPECTED_MIGRATION_VERSIONS =
			Set.of(
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9"
			);

	private static final Set<String>
			EXPECTED_TABLES =
			Set.of(
					"equipment",
					"loans",
					"admins"
			);

	private static final Set<String>
			EXPECTED_CONSTRAINTS = Set.of(
			"equipment_pkey",
			"loans_pkey",
			"fk_loans_equipment",
			"chk_equipment_type_allowed",
			"chk_equipment_serial_number_not_blank",
			"chk_equipment_type_not_blank",
			"chk_loans_borrower_name_not_blank",
			"chk_loans_email_not_blank",
			"chk_loans_phone_number_not_blank",
			"admins_pkey",
			"chk_admins_username_not_blank",
			"chk_admins_password_hash_not_blank",
			"chk_loans_return_state_consistent",
			"chk_equipment_condition_allowed",
			"chk_equipment_age_category_allowed",
			"chk_equipment_size_not_blank",
			"chk_equipment_brand_not_blank",
			"chk_equipment_model_not_blank",
			"chk_equipment_storage_location_not_blank"
	);

	private static final Set<String>
			EXPECTED_INDEXES = Set.of(
			"ux_equipment_serial_number_lower",
			"idx_equipment_available",
			"idx_equipment_type",
			"idx_loans_equipment_id",
			"idx_loans_returned",
			"idx_loans_loan_date",
			"ux_loans_one_active_loan_per_equipment",
			"ux_admins_username_lower",
			"idx_loans_history_sort",
			"idx_loans_status_history_sort",
			"idx_equipment_active",
			"idx_equipment_condition",
			"idx_equipment_age_category",
			"idx_equipment_active_available_type"
	);

	@Container
	@ServiceConnection
	private static final PostgreSQLContainer
			POSTGRES =
			new PostgreSQLContainer(
					"postgres:17-alpine"
			)
					.withDatabaseName(
							"hockeylan_test"
					)
					.withUsername(
							"hockeylan_test"
					)
					.withPassword(
							"hockeylan_test"
					);

	private final ConfigurableApplicationContext
			applicationContext;

	private final Environment environment;

	private final DataSource dataSource;

	private final Flyway flyway;

	private final JdbcTemplate jdbcTemplate;

	private final EquipmentRepository
			equipmentRepository;

	private final LoanRepository loanRepository;

	@Autowired
	HockeylanApplicationTests(
			ConfigurableApplicationContext
					applicationContext,
			Environment environment,
			DataSource dataSource,
			Flyway flyway,
			JdbcTemplate jdbcTemplate,
			EquipmentRepository
					equipmentRepository,
			LoanRepository loanRepository
	) {
		this.applicationContext =
				applicationContext;
		this.environment = environment;
		this.dataSource = dataSource;
		this.flyway = flyway;
		this.jdbcTemplate = jdbcTemplate;
		this.equipmentRepository =
				equipmentRepository;
		this.loanRepository = loanRepository;
	}

	@BeforeEach
	void cleanApplicationData() {
		loanRepository.deleteAllInBatch();
		equipmentRepository.deleteAllInBatch();
	}

	@Test
	void springContextStartsWithTestProfileAndRequiredBeans() {
		assertThat(
				applicationContext.isActive()
		).isTrue();

		assertThat(
				environment.getActiveProfiles()
		).contains("test");

		assertThat(
				applicationContext.getBean(
						DataSource.class
				)
		).isSameAs(dataSource);

		assertThat(
				applicationContext.getBean(
						Flyway.class
				)
		).isSameAs(flyway);

		assertThat(
				applicationContext.getBean(
						EquipmentRepository.class
				)
		).isSameAs(equipmentRepository);

		assertThat(
				applicationContext.getBean(
						LoanRepository.class
				)
		).isSameAs(loanRepository);
	}

	@Test
	void postgresqlTestcontainerProvidesTheApplicationsDataSource()
			throws SQLException {

		assertThat(
				POSTGRES.isRunning()
		).isTrue();

		try (
				Connection connection =
						dataSource.getConnection()
		) {
			assertThat(
					connection.isValid(5)
			).isTrue();

			assertThat(
					connection
							.getMetaData()
							.getURL()
			).isEqualTo(
					POSTGRES.getJdbcUrl()
			);

			assertThat(
					connection.getCatalog()
			).isEqualTo(
					POSTGRES.getDatabaseName()
			);
		}

		assertThat(
				POSTGRES.getMappedPort(
						PostgreSQLContainer
								.POSTGRESQL_PORT
				)
		).isNotEqualTo(
				PostgreSQLContainer
						.POSTGRESQL_PORT
		);
	}

	@Test
	void flywayMigratesAnEmptyDatabaseThroughEveryExpectedVersion() {
		MigrationInfo[] appliedMigrations =
				flyway.info().applied();

		Set<String> appliedVersions =
				Arrays.stream(
								appliedMigrations
						)
						.map(
								MigrationInfo::getVersion
						)
						.map(Object::toString)
						.collect(
								Collectors.toSet()
						);

		assertThat(appliedVersions)
				.containsExactlyInAnyOrderElementsOf(
						EXPECTED_MIGRATION_VERSIONS
				);

		assertThat(appliedMigrations)
				.hasSize(
						EXPECTED_MIGRATION_VERSIONS
								.size()
				)
				.allMatch(
						migration ->
								migration.getState()
										== MigrationState
										.SUCCESS
				);
	}

	@Test
	void flywayCreatesExpectedApplicationTables() {
		Set<String> actualTables =
				Set.copyOf(
						jdbcTemplate.queryForList(
								"""
                                SELECT table_name
                                FROM information_schema.tables
                                WHERE table_schema = 'public'
                                  AND table_type = 'BASE TABLE'
                                  AND table_name IN (
                                      'equipment',
                                      'loans',
                                      'admins'
                                  )
                                """,
								String.class
						)
				);

		assertThat(actualTables)
				.containsExactlyInAnyOrderElementsOf(
						EXPECTED_TABLES
				);
	}

	@Test
	void flywayCreatesExpectedEquipmentColumns() {
		List<ColumnMetadata> columns =
				jdbcTemplate.query(
						"""
                        SELECT
                            column_name,
                            data_type,
                            character_maximum_length,
                            is_nullable,
                            column_default
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'equipment'
                          AND column_name IN (
                              'size',
                              'brand',
                              'model',
                              'condition',
                              'age_category',
                              'storage_location',
                              'active'
                          )
                        """,
						(
								resultSet,
								rowNumber
						) -> new ColumnMetadata(
								resultSet.getString(
										"column_name"
								),
								resultSet.getString(
										"data_type"
								),
								resultSet.getObject(
										"character_maximum_length",
										Integer.class
								),
								resultSet.getString(
										"is_nullable"
								),
								resultSet.getString(
										"column_default"
								)
						)
				);

		Map<String, ColumnMetadata>
				columnsByName =
				columns.stream()
						.collect(
								Collectors.toMap(
										ColumnMetadata::name,
										Function.identity()
								)
						);

		assertThat(columnsByName.keySet())
				.containsExactlyInAnyOrder(
						"size",
						"brand",
						"model",
						"condition",
						"age_category",
						"storage_location",
						"active"
				);

		assertTextColumn(
				columnsByName,
				"size",
				50,
				true
		);

		assertTextColumn(
				columnsByName,
				"brand",
				100,
				true
		);

		assertTextColumn(
				columnsByName,
				"model",
				100,
				true
		);

		assertTextColumn(
				columnsByName,
				"condition",
				30,
				false
		);

		assertTextColumn(
				columnsByName,
				"age_category",
				30,
				true
		);

		assertTextColumn(
				columnsByName,
				"storage_location",
				100,
				true
		);

		ColumnMetadata activeColumn =
				columnsByName.get("active");

		assertThat(activeColumn).isNotNull();

		assertThat(activeColumn.dataType())
				.isEqualTo("boolean");

		assertThat(activeColumn.nullable())
				.isEqualTo("NO");

		assertThat(
				normalizeSql(
						activeColumn.defaultValue()
				)
		).contains("true");

		assertThat(
				normalizeSql(
						columnsByName
								.get("condition")
								.defaultValue()
				)
		).contains("good");
	}

	@Test
	void flywayCreatesExpectedConstraints() {
		Set<String> actualConstraints =
				Set.copyOf(
						jdbcTemplate.queryForList(
								"""
                                SELECT constraint_name
                                FROM information_schema.table_constraints
                                WHERE table_schema = 'public'
                                  AND table_name IN (
                                      'equipment',
                                      'loans',
                                      'admins'
                                  )
                                """,
								String.class
						)
				);

		assertThat(actualConstraints)
				.containsAll(
						EXPECTED_CONSTRAINTS
				);
	}

	@Test
	void flywayCreatesExpectedIndexes() {
		Set<String> actualIndexes =
				Set.copyOf(
						jdbcTemplate.queryForList(
								"""
                                SELECT indexname
                                FROM pg_indexes
                                WHERE schemaname = 'public'
                                  AND tablename IN (
                                      'equipment',
                                      'loans',
                                      'admins'
                                  )
                                """,
								String.class
						)
				);

		assertThat(actualIndexes)
				.containsAll(
						EXPECTED_INDEXES
				);
	}

	@Test
	void importantIndexesHaveExpectedDefinitions() {
		String serialNumberIndexDefinition =
				findIndexDefinition(
						"ux_equipment_serial_number_lower"
				);

		String activeLoanIndexDefinition =
				findIndexDefinition(
						"ux_loans_one_active_loan_per_equipment"
				);

		String equipmentFilterIndexDefinition =
				findIndexDefinition(
						"idx_equipment_active_available_type"
				);

		assertThat(
				normalizeSql(
						serialNumberIndexDefinition
				)
		)
				.contains("unique index")
				.contains(
						"lower((serial_number)::text)"
				);

		assertThat(
				normalizeSql(
						activeLoanIndexDefinition
				)
		)
				.contains("unique index")
				.contains("(equipment_id)")
				.contains(
						"where (returned = false)"
				);

		assertThat(
				normalizeSql(
						equipmentFilterIndexDefinition
				)
		)
				.contains(
						"(active, available, type)"
				);
	}

	@Test
	void repositoriesPersistEntitiesAgainstTheFlywaySchema() {
		Equipment equipment = new Equipment(
				EquipmentType.HELMET,
				"  integration-001  ",
				"  M  ",
				"  Bauer  ",
				"  Re-Akt 150  ",
				EquipmentCondition.GOOD,
				AgeCategory.JUNIOR,
				"  Hylla A2  ",
				"  Integration test helmet  "
		);

		Equipment savedEquipment =
				equipmentRepository
						.saveAndFlush(equipment);

		Loan loan = new Loan(
				savedEquipment,
				"  Test Borrower  ",
				"  TEST.BORROWER@EXAMPLE.COM  ",
				"  0701234567  "
		);

		Loan savedLoan =
				loanRepository
						.saveAndFlush(loan);

		assertThat(
				savedEquipment.getId()
		).isNotNull();

		assertThat(
				savedEquipment.getVersion()
		).isNotNull();

		assertThat(
				savedEquipment.getCreatedDate()
		).isNotNull();

		assertThat(
				savedEquipment.getUpdatedDate()
		).isNotNull();

		assertThat(
				savedEquipment.getSerialNumber()
		).isEqualTo(
				"INTEGRATION-001"
		);

		assertThat(
				savedEquipment.getSize()
		).isEqualTo("M");

		assertThat(
				savedEquipment.getBrand()
		).isEqualTo("Bauer");

		assertThat(
				savedEquipment.getModel()
		).isEqualTo("Re-Akt 150");

		assertThat(
				savedEquipment.getCondition()
		).isEqualTo(
				EquipmentCondition.GOOD
		);

		assertThat(
				savedEquipment.getAgeCategory()
		).isEqualTo(
				AgeCategory.JUNIOR
		);

		assertThat(
				savedEquipment
						.getStorageLocation()
		).isEqualTo("Hylla A2");

		assertThat(
				savedEquipment.getDescription()
		).isEqualTo(
				"Integration test helmet"
		);

		assertThat(
				savedEquipment.isAvailable()
		).isTrue();

		assertThat(
				savedEquipment.isActive()
		).isTrue();

		assertThat(
				savedLoan.getId()
		).isNotNull();

		assertThat(
				savedLoan.getVersion()
		).isNotNull();

		assertThat(
				savedLoan.getCreatedDate()
		).isNotNull();

		assertThat(
				savedLoan.getUpdatedDate()
		).isNotNull();

		assertThat(
				savedLoan.getLoanDate()
		).isNotNull();

		assertThat(
				savedLoan.getBorrowerName()
		).isEqualTo(
				"Test Borrower"
		);

		assertThat(
				savedLoan.getEmail()
		).isEqualTo(
				"test.borrower@example.com"
		);

		assertThat(
				savedLoan.getPhoneNumber()
		).isEqualTo(
				"0701234567"
		);

		assertThat(
				loanRepository
						.findByEquipmentIdAndReturnedFalse(
								savedEquipment.getId()
						)
		)
				.isPresent()
				.get()
				.extracting(Loan::getId)
				.isEqualTo(
						savedLoan.getId()
				);

		assertThat(
				savedLoan.isReturned()
		).isFalse();

		assertThat(
				savedLoan.getReturnedAt()
		).isNull();
	}

	@Test
	void newEquipmentColumnsUseExpectedDefaults() {
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
                    'DEFAULTS-001',
                    'HELMET',
                    0
                )
                """
		);

		Map<String, Object> equipmentRow =
				jdbcTemplate.queryForMap(
						"""
                        SELECT
                            condition,
                            active,
                            size,
                            brand,
                            model,
                            age_category,
                            storage_location
                        FROM equipment
                        WHERE serial_number =
                              'DEFAULTS-001'
                        """
				);

		assertThat(
				equipmentRow.get("condition")
		).isEqualTo("GOOD");

		assertThat(
				equipmentRow.get("active")
		).isEqualTo(true);

		assertThat(
				equipmentRow.get("size")
		).isNull();

		assertThat(
				equipmentRow.get("brand")
		).isNull();

		assertThat(
				equipmentRow.get("model")
		).isNull();

		assertThat(
				equipmentRow.get("age_category")
		).isNull();

		assertThat(
				equipmentRow.get(
						"storage_location"
				)
		).isNull();
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

		Long equipmentId =
				jdbcTemplate.queryForObject(
						"""
                        SELECT id
                        FROM equipment
                        WHERE serial_number =
                              'CONSTRAINT-001'
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

		List<String>
				activeLoanIndexDefinitions =
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

		assertThat(
				activeLoanIndexDefinitions
		)
				.hasSize(1)
				.allSatisfy(
						definition ->
								assertThat(
										normalizeSql(
												definition
										)
								)
										.contains(
												"unique index"
										)
										.contains(
												"(equipment_id)"
										)
										.contains(
												"where (returned = false)"
										)
				);
	}

	private void assertTextColumn(
			Map<String, ColumnMetadata>
					columnsByName,
			String columnName,
			int expectedLength,
			boolean nullable
	) {
		ColumnMetadata column =
				columnsByName.get(columnName);

		assertThat(column).isNotNull();

		assertThat(column.dataType())
				.isEqualTo(
						"character varying"
				);

		assertThat(column.maximumLength())
				.isEqualTo(expectedLength);

		assertThat(column.nullable())
				.isEqualTo(
						nullable ? "YES" : "NO"
				);
	}

	private String findIndexDefinition(
			String indexName
	) {
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
		if (sql == null) {
			return "";
		}

		return sql
				.replace("\"", "")
				.replaceAll("\\s+", " ")
				.trim()
				.toLowerCase();
	}

	private record ColumnMetadata(
			String name,
			String dataType,
			Integer maximumLength,
			String nullable,
			String defaultValue
	) {
	}
}