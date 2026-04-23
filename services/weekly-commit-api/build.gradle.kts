import com.diffplug.gradle.spotless.SpotlessExtension

plugins {
    java
    jacoco
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
    id("com.diffplug.spotless") version "6.25.0"
    id("com.github.spotbugs") version "6.0.26"
}

group = "com.st6.weeklycommit"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

extra["springdocVersion"] = "2.6.0"
extra["testcontainersVersion"] = "1.21.3"
extra["microsoftGraphVersion"] = "6.16.0"
extra["azureIdentityVersion"] = "1.14.2"

dependencies {
    // Web + JSON
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Persistence
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.flywaydb:flyway-core")
    // Spring Boot 3.3 ships Flyway 10 — DB modules are now split out and
    // must be declared explicitly for PostgreSQL or migrations fail at runtime.
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")

    // (Spring State Machine library was considered; the explicit
    //  PlanLifecycleService is a state machine without the framework ceremony.
    //  See CLAUDE.md for the rationale.)

    // OpenAPI + observability
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:${property("springdocVersion")}")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")

    // Microsoft Graph (Outlook integration — Phase 6)
    implementation("com.microsoft.graph:microsoft-graph:${property("microsoftGraphVersion")}")
    implementation("com.azure:azure-identity:${property("azureIdentityVersion")}")

    // AWS SDK (SNS/SQS — outbox publisher)
    implementation(platform("software.amazon.awssdk:bom:2.29.20"))
    implementation("software.amazon.awssdk:sns")
    implementation("software.amazon.awssdk:sqs")

    // Utilities
    compileOnly("org.projectlombok:lombok:1.18.34")
    annotationProcessor("org.projectlombok:lombok:1.18.34")
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation(platform("org.testcontainers:testcontainers-bom:${property("testcontainersVersion")}"))
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("io.rest-assured:rest-assured:5.5.0")
    testCompileOnly("org.projectlombok:lombok:1.18.34")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.34")
    // Gradle 9.0+ no longer auto-includes the JUnit launcher; declare explicitly.
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.compilerArgs.addAll(listOf("-Xlint:all", "-parameters"))
}

tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
    systemProperty("spring.profiles.active", "test")
    // Pin the test JVM to the same toolchain as compileJava so Testcontainers
    // (jna / docker-java reflective access) doesn't run on the system Java 25
    // where sun.misc.Unsafe access is restricted.
    javaLauncher = javaToolchains.launcherFor {
        languageVersion = JavaLanguageVersion.of(21)
    }
    // Defensive flags for native access on newer JDKs (no-op on 21).
    jvmArgs("--enable-native-access=ALL-UNNAMED")
    // Docker 29 server speaks API 1.53; older docker-java client gets a 400
    // unless we pin a compatible version explicitly.
    environment("DOCKER_HOST", "unix:///var/run/docker.sock")
    environment("DOCKER_API_VERSION", "1.45")
    environment("TESTCONTAINERS_RYUK_DISABLED", "true")
}

jacoco {
    toolVersion = "0.8.12"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    "**/WeeklyCommitApplication.*",
                    "**/config/**",
                    "**/dto/**",
                    "**/*MapperImpl.*",
                )
            }
        })
    )
}

tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.jacocoTestReport)
    violationRules {
        rule {
            limit {
                counter = "INSTRUCTION"
                minimum = "0.80".toBigDecimal()
            }
            // Apply to domain + service packages where the real business
            // logic lives. Excludes config/dto/mapper noise.
            includes = listOf(
                "com.st6.weeklycommit.domain.*",
                "com.st6.weeklycommit.service.*",
            )
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}

configure<SpotlessExtension> {
    java {
        target("src/**/*.java")
        googleJavaFormat("1.24.0").reflowLongStrings()
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    kotlinGradle {
        target("*.gradle.kts")
        ktlint("1.4.1")
    }
}

spotbugs {
    toolVersion = "4.8.6"
    effort = com.github.spotbugs.snom.Effort.LESS
    reportLevel = com.github.spotbugs.snom.Confidence.HIGH
    excludeFilter = file("config/spotbugs/exclude.xml")
}

tasks.spotbugsMain {
    reports.create("html") { required = true }
    reports.create("xml") { required = false }
}

tasks.named("spotbugsTest") {
    enabled = false
}
