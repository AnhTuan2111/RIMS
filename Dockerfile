# =============================================================================
# RIMS — một ảnh Docker chứa cả backend lẫn frontend
# =============================================================================
#
# VÌ SAO GỘP LÀM MỘT: bản build React được chép vào thư mục static của Spring
# Boot, nên cả hai dùng chung một tên miền. Cùng tên miền thì:
#   - baseURL '/rims' và endpoint '/ws-rims' ở frontend chạy nguyên, không
#     phải sửa sang URL tuyệt đối;
#   - không có CORS;
#   - WebSocket nối thẳng, không vướng giới hạn "rewrite của static site không
#     proxy được WebSocket" trên Render.
#
# Xem SpaResourceConfig.java để biết cách các đường dẫn của React Router được
# trả về index.html mà không nuốt mất /rims/** và /ws-rims/**.
#
# Chạy thử ở máy:
#   docker build -t rims .
#   docker run --rm -p 8080:8080 --env-file .env -e DB_URL=... rims
# =============================================================================


# ---------- Tầng 1: dựng giao diện ----------
# Vite 8 đòi Node 20.19+ hoặc 22+.
FROM node:22-alpine AS frontend

WORKDIR /app/frontend

# Chép bản kê thư viện trước rồi mới cài: chừng nào hai tệp này không đổi thì
# Docker dùng lại tầng đã cài, khỏi tải lại toàn bộ node_modules mỗi lần sửa
# một dòng giao diện.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# vite.config.ts đọc .env ở thư mục cha (envDir). Ở đây không có tệp đó, và
# cũng không cần: bản dựng này gọi API cùng tên miền nên không dùng biến VITE_
# nào cả. loadEnv trả về rỗng, mọi thứ vẫn chạy.
#
# "npm run build" = typecheck + test + vite build. Giữ cả ba để một lỗi kiểu
# hay một test hỏng chặn được bản dựng ngay tại đây, thay vì đẩy lên máy chủ
# rồi mới biết.
RUN npm run build


# ---------- Tầng 2: dựng backend ----------
FROM maven:3.9-eclipse-temurin-21 AS backend

WORKDIR /app

# Cũng vì bộ đệm: tải thư viện theo pom.xml trước, rồi mới chép mã nguồn.
COPY backend/rims-api/pom.xml ./
RUN mvn -B -q dependency:go-offline

# Spotless chạy ở phase process-sources và đọc tệp cấu hình này qua
# ${project.basedir}. Thiếu nó thì build đứt.
COPY backend/rims-api/eclipse-formatter.properties ./
COPY backend/rims-api/src ./src

# Đây là chỗ hai nửa gặp nhau: bản build React thành tài nguyên tĩnh của Spring.
COPY --from=frontend /app/frontend/dist ./src/main/resources/static

# Bỏ test ở bước này cho đỡ tốn phút build (gói miễn phí của Render tính phút).
# Test backend chạy ở máy và ở CI bằng: ./mvnw test
RUN mvn -B -q package -DskipTests


# ---------- Tầng 3: chạy ----------
# Chỉ JRE, không kèm JDK và Maven: ảnh nhỏ hơn nhiều và bề mặt tấn công ít hơn.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Không chạy bằng root.
RUN addgroup -S rims && adduser -S rims -G rims
USER rims

# Dùng ký tự đại diện để khỏi phải sửa Dockerfile mỗi lần lên phiên bản trong
# pom.xml. Không dính rims-api-1.0.0.jar.original vì tệp đó không kết thúc
# bằng ".jar".
COPY --from=backend /app/target/*.jar app.jar

# MaxRAMPercentage thay cho -Xmx: JVM tự tính theo bộ nhớ CỦA CONTAINER. Mặc
# định JVM chỉ lấy 1/4 bộ nhớ, quá dè dặt khi container chỉ có 512 MB.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70"

# Chỉ để ghi chú; cổng thật lấy từ biến PORT lúc chạy.
EXPOSE 8080

# Vì sao có --server.port=${PORT}: Render (và hầu hết nền tảng tương tự) cấp
# cổng qua biến PORT chứ không cho chọn, nên phải nghe đúng cổng đó. Có mặc
# định 8080 để "docker run -p 8080:8080" ở máy vẫn chạy mà không cần khai gì.
#
# "exec" để java thành tiến trình số 1 và nhận được tín hiệu SIGTERM lúc nền
# tảng dừng container — nhờ vậy Spring Boot tắt êm, đóng nốt kết nối CSDL thay
# vì bị giết ngang.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar --server.port=${PORT:-8080}"]
