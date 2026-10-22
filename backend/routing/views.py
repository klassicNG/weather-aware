"""
API Views for Weather-Aware Truck Routing
"""

from datetime import datetime, timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import RouteAnalyzeRequestSerializer
from .services import process_route_analysis


@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint for monitoring and test verification.
    """
    return Response({
        "status": "ok",
        "service": "weather-aware-truck-routing",
        "version": "1.0.0"
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
def analyze_routes(request):
    """
    Analyzes routes between origin and destination, samples checkpoints,
    fetches weather forecasts, evaluates weather risks with truck load rules,
    and returns 3 guaranteed route options with the recommended winner.
    """
    serializer = RouteAnalyzeRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "error": "Validation error",
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    origin = validated_data["origin"]
    destination = validated_data["destination"]
    departure_time = validated_data.get("departure_time") or ""
    if not departure_time:
        departure_time = datetime.now(timezone.utc).isoformat()

    load_weight = validated_data.get("load_weight", 0.0)
    checkpoint_interval = validated_data.get("checkpoint_interval", 50.0)

    try:
        result = process_route_analysis(
            origin_input=origin,
            destination_input=destination,
            departure_time_iso=departure_time,
            load_weight=load_weight,
            checkpoint_interval_miles=checkpoint_interval
        )
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": "Failed to analyze routes",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
