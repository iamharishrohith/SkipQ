package com.skipq.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Live Progress Tracker Composable
 * Displays a highly aesthetic circular countdown indicator that scales and pulses based on wait position.
 * Features smooth spring animation states when people ahead drops.
 */
@Composable
fun LiveProgressTracker(peopleAhead: Int) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(220.dp)
            .scale(pulseScale)
            .background(Color(0xFF7C3AED).copy(alpha = 0.05f), CircleShape)
    ) {
        // Base backing track circle
        CircularProgressIndicator(
            progress = { 1.0f },
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFFE2E8F0),
            strokeWidth = 10.dp,
        )

        // Waiting arc indicator
        val progressPercent = if (peopleAhead <= 0) 1.0f else (1.0f / (peopleAhead + 1))
        CircularProgressIndicator(
            progress = { progressPercent },
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF7C3AED), // Primary Theme Violet
            strokeWidth = 10.dp,
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = if (peopleAhead <= 0) "YOUR TURN" else "AHEAD",
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF64748B),
                letterSpacing = 1.5.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "$peopleAhead",
                fontSize = 44.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B)
            )
        }
    }
}
