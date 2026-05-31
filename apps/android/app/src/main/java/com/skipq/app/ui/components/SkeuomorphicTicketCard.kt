package com.skipq.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.skipq.app.data.TicketState

/**
 * Skeuomorphic Ticket Card
 * Renders a highly-polished Material 3 white "physical paper ticket" using canvas techniques.
 * Features a dashed tearing line, dynamic color status badges, and expandable regional Gemini advice.
 */
@Composable
fun SkeuomorphicTicketCard(state: TicketState) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Card Header Brand
            Text(
                text = "SKIPQ OFFICIAL TOKEN",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF64748B),
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(16.dp))

            // Token Number Callout
            Text(
                text = state.tokenNumber.ifEmpty { "T-000" },
                fontSize = 54.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF7C3AED) // Theme Neon Violet
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Ticket Status Badge
            val (badgeText, badgeColor) = when (state.status) {
                "active" -> "NOW SERVING" to Color(0xFF10B981) // Success Green
                "benched" -> "BENCHED" to Color(0xFFF59E0B) // Warning Yellow
                "completed" -> "SERVED" to Color(0xFF3B82F6) // Success Blue
                else -> "WAITING" to Color(0xFF7C3AED) // Primary Violet
            }

            Box(
                modifier = Modifier
                    .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text(
                    text = badgeText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = badgeColor
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Skeuomorphic Dashed Paper Tear Cut
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
            ) {
                drawLine(
                    color = Color(0xFFE2E8F0),
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 15f), 0f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Ticket Wait Metrics Panel
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "AHEAD OF YOU", fontSize = 10.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${state.peopleAhead} people",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF1E293B)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "EST. WAIT TIME", fontSize = 10.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${state.estimatedWaitMinutes} mins",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF1E293B)
                    )
                }
            }

            // Expanding Google Gemini Smart Guidance Area
            AnimatedVisibility(visible = state.aiAdvice.isNotEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(Color(0xFFEEF2F6), Color(0xFFF8FAFC))
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .padding(14.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "✨ GEMINI LIVE ASSIST",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF7C3AED),
                                letterSpacing = 1.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = state.aiAdvice,
                            fontSize = 12.sp,
                            lineHeight = 16.sp,
                            color = Color(0xFF334155),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
