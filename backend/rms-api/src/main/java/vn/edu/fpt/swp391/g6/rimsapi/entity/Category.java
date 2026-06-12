package vn.edu.fpt.swp391.g6.rimsapi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "categories")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Category
{
    @Id
    @Column(name = "category_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Nationalized
    @Column(name = "category_name", length = 50, nullable = false, unique = true)
    private String name;

    @Nationalized
    private String description;

    @OneToMany(mappedBy = "category")
    private List<Dish> dishes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
