package com.tennis.calendar.request;

import lombok.Data;

@Data
public class UpdateUserRequest {

    private String firstName;
    private String lastName;
    private String cellNumber;

}
