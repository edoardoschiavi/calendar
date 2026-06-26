package com.tennis.calendar.controller;

import com.tennis.calendar.dto.UserDto;
import com.tennis.calendar.model.User;
import com.tennis.calendar.repository.ApiResponse;
import com.tennis.calendar.request.CreateUserRequest;
import com.tennis.calendar.request.UpdateUserRequest;
import com.tennis.calendar.service.user.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("${api.prefix}/users")
public class UserController {

    private final IUserService userService;

    @GetMapping("/{userId}/user")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        UserDto convertedUser = userService.convertUserToDto(user);
        return ResponseEntity.ok(new ApiResponse("User found!", convertedUser));
    };

    @PostMapping("/add")
    public ResponseEntity<ApiResponse> updateUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        UserDto convertedUser = userService.convertUserToDto(user);
        return ResponseEntity.ok(new ApiResponse("Success!", convertedUser));
    };

    @PutMapping("/{userId}/update")
    public ResponseEntity<ApiResponse> updateUser(@RequestBody UpdateUserRequest request, @PathVariable Long userId) {
        User user = userService.updateUser(request, userId);
        UserDto convertedUser = userService.convertUserToDto(user);
        return ResponseEntity.ok(new ApiResponse("Success!", convertedUser));
    };

    @DeleteMapping("/{userId}/delete")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(new ApiResponse("Success", null));
    };

}
