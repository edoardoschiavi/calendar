package com.tennis.calendar.service.user;

import com.tennis.calendar.dto.UserDto;
import com.tennis.calendar.model.User;
import com.tennis.calendar.request.CreateUserRequest;
import com.tennis.calendar.request.UpdateUserRequest;

import java.util.List;

public interface IUserService {

    User createUser(CreateUserRequest request);
    User updateUser(UpdateUserRequest request, Long userId);
    User getUserById(Long userId);
    void deleteUser(Long userId);

    List<UserDto> getConvertedUsers(List<User> users);

    UserDto convertUserToDto(User user);
}
