package com.smarthire.config;

import com.smarthire.entity.AppUser;
import com.smarthire.entity.JobDescription;
import com.smarthire.repository.AppUserRepository;
import com.smarthire.repository.JobDescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final JobDescriptionRepository jdRepository;

    @Override
    public void run(String... args) {
        seedUsers();
        seedJobDescriptions();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        userRepository.saveAll(List.of(
                AppUser.builder().name("Admin User").email("admin@smarthire.com")
                        .password("admin123").role("ADMIN").build(),
                AppUser.builder().name("HR Recruiter").email("recruiter@smarthire.com")
                        .password("recruiter123").role("RECRUITER").build(),
                AppUser.builder().name("Demo Candidate").email("candidate@smarthire.com")
                        .password("candidate123").role("CANDIDATE").build()
        ));
        log.info("Seeded default users");
    }

    private void seedJobDescriptions() {
        if (jdRepository.count() > 0) return;

        jdRepository.saveAll(List.of(buildJavaArchitectJD(), buildJavaDeveloperJD()));
        log.info("Seeded 2 sample Job Descriptions");
    }

    private JobDescription buildJavaArchitectJD() {
        return JobDescription.builder()
                .title("Java Architect")
                .company("Wissen Technology")
                .location("Pune / Mumbai")
                .modeOfWork("Hybrid")
                .experienceRequired("12+")
                .experienceMin(12)
                .experienceMax(25)
                .isActive(true)
                .skills("Core Java,Java 8+,Spring Boot,Spring,Microservices,RESTful APIs,Hibernate,JPA,SQL,NoSQL,Kafka,RabbitMQ,Docker,Kubernetes,AWS,Azure,GCP,CI/CD,Jenkins,Git,Design Patterns,DDD,OAuth2,JWT")
                .content(JAVA_ARCHITECT_CONTENT)
                .build();
    }

    private JobDescription buildJavaDeveloperJD() {
        return JobDescription.builder()
                .title("Java Developer")
                .company("Wissen Technology")
                .location("Bangalore")
                .modeOfWork("Hybrid")
                .experienceRequired("5-8")
                .experienceMin(5)
                .experienceMax(8)
                .isActive(true)
                .skills("Java,Spring,Spring Boot,Hibernate,RESTful APIs,Microservices,SQL,NoSQL,AWS,Azure,GCP,Data Structures,Algorithms,Design Patterns,Object-Oriented Programming")
                .content(JAVA_DEVELOPER_CONTENT)
                .build();
    }

    private static final String JAVA_ARCHITECT_CONTENT = """
            Wissen Technology is hiring for Java Architect

            About Wissen Technology
            At Wissen Technology, we deliver niche, custom-built products that solve complex business challenges across industries worldwide.
            Founded in 2015, our core philosophy is built around a strong product engineering mindset—ensuring every solution is architected and delivered right the first time.
            Today, Wissen Technology has a global footprint with 2000+ employees across offices in the US, UK, UAE, India, and Australia.
            Our commitment to excellence translates into delivering 2X impact compared to traditional service providers.

            Job Summary
            Wissen Technology is hiring an experienced Java Architect to design, develop, and guide scalable enterprise applications.
            The role involves defining architecture, mentoring teams, and ensuring best practices across the development lifecycle.

            Experience: 12+ years
            Location: Pune / Mumbai
            Mode of Work: Hybrid

            Key Responsibilities
            - Define and own the overall application architecture and design standards
            - Design scalable, high-performance, and secure Java-based applications
            - Provide technical leadership and guidance to development teams
            - Review code, design documents, and ensure adherence to best practices
            - Collaborate with product owners, stakeholders, and cross-functional teams
            - Drive cloud-native, microservices, and API-based architectures
            - Identify and resolve performance, security, and scalability issues
            - Participate in technical decision-making and architecture governance

            Required Skills
            - Strong expertise in Core Java, Java 8+
            - Hands-on experience with Spring, Spring Boot
            - Experience in Microservices architecture
            - Strong knowledge of RESTful APIs
            - Experience with Hibernate / JPA
            - Working knowledge of SQL / NoSQL databases
            - Experience with Kafka / RabbitMQ (preferred)
            - Exposure to Docker, Kubernetes
            - Experience with AWS / Azure / GCP

            Good to Have
            - Experience with DevOps tools (CI/CD, Jenkins, Git)
            - Knowledge of design patterns and architectural patterns
            - Experience in domain-driven design (DDD)
            - Exposure to security standards (OAuth2, JWT)

            Soft Skills
            - Strong communication and stakeholder management skills
            - Ability to mentor and guide senior and junior developers
            - Strong problem-solving and analytical skills

            About Wissen Technology:
            Website: www.wissen.com | LinkedIn: Wissen Technology
            """;

    private static final String JAVA_DEVELOPER_CONTENT = """
            Wissen Technology is hiring for Java Developer

            About Wissen Technology
            At Wissen Technology, we deliver niche, custom-built products that solve complex business challenges across industries worldwide.
            Founded in 2015, our core philosophy is built around a strong product engineering mindset.
            Wissen Technology has a global footprint with 2000+ employees across offices in the US, UK, UAE, India, and Australia.

            Job Summary
            Wissen Technology is hiring a seasoned Java Developer to join our high-performing engineering team.
            This role demands strong technical expertise, ownership, and a passion for building scalable enterprise-grade applications from the ground up.

            Experience: 5 to 8 years
            Location: Bangalore
            Mode of Work: Hybrid

            Key Responsibilities
            - Design, develop, test, and deploy scalable Java applications
            - Collaborate with cross-functional teams to define, design, and deliver new features
            - Solve complex technical problems with innovative, simple solutions
            - Write clean, efficient, and well-documented code
            - Participate in code reviews to maintain code quality
            - Continuously discover, evaluate, and implement new technologies
            - Exhibit ownership and responsibility for assigned deliverables

            Required Skills
            - 5 to 8 years of hands-on Java development experience
            - Strong experience in building products from scratch (not just maintenance/support)
            - Good understanding of object-oriented programming principles
            - Experience with Spring, Spring Boot, Hibernate
            - Strong knowledge of data structures, algorithms, and design patterns
            - Familiarity with RESTful APIs and microservices architecture
            - Solid understanding of database technologies (SQL, NoSQL)
            - Exposure to cloud platforms (AWS, Azure, or GCP)
            - Strong debugging and troubleshooting skills

            Good to Have
            - Excellent problem-solving skills and logical reasoning
            - High levels of ownership, accountability, and self-drive
            - Strong communication skills and a collaborative approach
            - Commitment to continuous learning and improvement

            About Wissen Technology:
            Website: https://www.wissen.com | LinkedIn: Wissen Technology
            """;
}
