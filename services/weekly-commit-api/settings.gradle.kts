// Foojay toolchain resolver lets Gradle download the JDK declared in
// build.gradle.kts (Java 21) when it's not already on the host. Keeps the
// brief-required toolchain pin while removing the manual `brew install
// openjdk@21` step.
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "weekly-commit-api"
