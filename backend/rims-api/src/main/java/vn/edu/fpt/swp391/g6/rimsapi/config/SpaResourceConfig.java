package vn.edu.fpt.swp391.g6.rimsapi.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Phục vụ bản build React nằm trong {@code classpath:/static/}, và trả
 * {@code index.html} cho các đường dẫn của React Router.
 *
 * <p>VÌ SAO CẦN: khi deploy, Dockerfile chép {@code frontend/dist} vào
 * {@code src/main/resources/static}, nên backend và frontend dùng chung một tên
 * miền. Cùng tên miền thì {@code baseURL: '/rims'} trong
 * {@code shared/api/client.ts} và {@code '/ws-rims'} trong
 * {@code realtime/stompClient.ts} chạy nguyên không phải sửa, và không có CORS.
 *
 * <p>VÌ SAO PHẢI TỰ VIẾT chứ không để Spring Boot lo: Spring chỉ trả tệp có
 * thật. Người dùng đang ở {@code /admin/dishes} mà bấm F5 thì trình duyệt hỏi
 * máy chủ đường dẫn đó — trên đĩa không có tệp nào tên vậy, vì nó là route do
 * React Router dựng trong trình duyệt. Không có lớp này thì mọi lần F5 ở màn
 * sâu đều ra 404.
 *
 * <p>ĐIỀU QUAN TRỌNG NHẤT Ở ĐÂY là hai lần trả {@code null} bên dưới. Bộ xử lý
 * này đăng ký ở {@code /**} nên nó đứng cuối hàng và hứng mọi thứ không khớp
 * controller nào. Nếu cứ thấy không có tệp là trả {@code index.html} thì:
 * <ul>
 *   <li>gọi sai một đường dẫn API sẽ nhận HTML kèm mã 200 thay vì JSON 404, và
 *       {@code axios} ở frontend sẽ coi như thành công rồi vỡ ở chỗ khác — rất
 *       khó lần ra;</li>
 *   <li>xin một tệp ảnh hay .js không tồn tại cũng nhận HTML, và trình duyệt
 *       báo lỗi kiểu MIME chẳng liên quan gì đến nguyên nhân thật.</li>
 * </ul>
 * Trả {@code null} thì Spring ném {@code NoResourceFoundException}, và
 * {@code GlobalExceptionHandler} biến nó thành đúng JSON 404 như trước.
 */
@Configuration
public class SpaResourceConfig implements WebMvcConfigurer
{

    /** Vỏ ứng dụng. Đọc một lần, Spring tự lo phần đệm. */
    private static final Resource INDEX = new ClassPathResource("static/index.html");

    /**
     * Tiền tố của những đường dẫn KHÔNG phải của React Router.
     *
     * <p>Không có dấu {@code /} ở đầu: tham số {@code resourcePath} mà Spring
     * đưa vào đã bị cắt mất dấu đó.
     */
    private static final String[] BACKEND_PREFIXES = {"rims/", "ws-rims/"};

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry)
    {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver()
                {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location)
                            throws IOException
                    {
                        Resource requested = location.createRelative(resourcePath);

                        // Tệp có thật (index.html, /assets/*.js, /image/*.jpg) —
                        // trả thẳng.
                        if (requested.exists() && requested.isReadable())
                        {
                            return requested;
                        }

                        // API và WebSocket: để nguyên 404 JSON, đừng trả vỏ ứng dụng.
                        for (String prefix : BACKEND_PREFIXES)
                        {
                            if (resourcePath.startsWith(prefix))
                            {
                                return null;
                            }
                        }

                        // Có phần mở rộng nghĩa là đang xin một TỆP (ảnh, .js,
                        // .css, .map) chứ không phải một màn hình. Tệp không có
                        // thì đó là 404 thật.
                        if (resourcePath.contains("."))
                        {
                            return null;
                        }

                        // Còn lại là đường dẫn của React Router: /admin/dishes,
                        // /waiter/tables, /payment-success... Trả vỏ ứng dụng để
                        // React Router tự dựng đúng màn hình.
                        return INDEX;
                    }
                });
    }
}
