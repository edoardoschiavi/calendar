package com.tennis.calendar.service.user;

import com.tennis.calendar.dto.UserDto;
import com.tennis.calendar.model.User;
import com.tennis.calendar.repository.UserRepository;
import com.tennis.calendar.request.CreateUserRequest;
import com.tennis.calendar.request.UpdateUserRequest;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public User createUser(CreateUserRequest request) {
        return Optional.of(request)
                .filter(user -> !userRepository.existsByEmail(request.getEmail()))
                .map(req -> {
                    User user = new User();
                    user.setFirstName(req.getFirstName());
                    user.setLastName(req.getLastName());
                    user.setEmail(req.getEmail());
                    user.setCellNumber(req.getCellNumber());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new EntityExistsException("User " + request.getEmail() + " already exists!"));
    }

    @Override
    public User updateUser(UpdateUserRequest request, Long userId) {
        return userRepository
                .findById(userId)
                .map(existingUser -> {
                    existingUser.setFirstName(request.getFirstName());
                    existingUser.setLastName(request.getLastName());
                    return  userRepository.save(existingUser);
                })
                .orElseThrow(() -> new EntityNotFoundException("User not found!"));
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found!"));
    }

    @Override
    public void deleteUser(Long userId) {
        User userToDelete = getUserById(userId);
        userRepository.delete(userToDelete);
    }

    @Override
    public List<UserDto> getConvertedUsers(List<User> users) {
        return users
                .stream()
                .map(this::convertUserToDto)
                .toList();
    };

    @Override
    public UserDto convertUserToDto(User user) {
        return modelMapper.map(user, UserDto.class);
    }

}
