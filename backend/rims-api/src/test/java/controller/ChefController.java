package controller;



import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChefController {

    @GetMapping("/chef")
    public String test() {

        return "Chef OK";
    }
}
