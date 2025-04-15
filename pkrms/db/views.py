from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.apps import apps
from django.core.exceptions import ValidationError
from .parsers import CustomJSONParser
import math
import numpy as np
from .utils.helpers import generate_admin_code
from .serializers import (
    BridgeInventorySerializer,
    CODE_AN_ParametersSerializer,
    CODE_AN_UnitCostsPERSerializer,
    CODE_AN_UnitCostsPERUnpavedSerializer,
    CODE_AN_UnitCostsREHSerializer,
    CODE_AN_UnitCostsRIGIDSerializer,
    CODE_AN_UnitCostsRMSerializer,
    CODE_AN_UnitCostsUPGUnpavedSerializer,
    CODE_AN_UnitCostsWideningSerializer,
    CODE_AN_WidthStandardsSerializer,
    CulvertConditionSerializer,
    CulvertInventorySerializer,
    LinkSerializer,
    RetainingWallConditionSerializer,
    RetainingWallInventorySerializer,
    RoadConditionSerializer,
    RoadInventorySerializer,
    TrafficVolumeSerializer,
    FormDataSerializer
)

def clean_nan_values(data):
    if isinstance(data, dict):
        return {k: clean_nan_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nan_values(item) for item in data]
    elif isinstance(data, float) and (math.isnan(data) or np.isnan(data)):
        return None
    return data

# Map model names to their serializers
SERIALIZER_MAP = {
    'BridgeInventory': BridgeInventorySerializer,
    'CODE_AN_Parameters': CODE_AN_ParametersSerializer,
    'CODE_AN_UnitCostsPER': CODE_AN_UnitCostsPERSerializer,
    'CODE_AN_UnitCostsPERUnpaved': CODE_AN_UnitCostsPERUnpavedSerializer,
    'CODE_AN_UnitCostsREH': CODE_AN_UnitCostsREHSerializer,
    'CODE_AN_UnitCostsRIGID': CODE_AN_UnitCostsRIGIDSerializer,
    'CODE_AN_UnitCostsRM': CODE_AN_UnitCostsRMSerializer,
    'CODE_AN_UnitCostsUPGUnpaved': CODE_AN_UnitCostsUPGUnpavedSerializer,
    'CODE_AN_UnitCostsWidening': CODE_AN_UnitCostsWideningSerializer,
    'CODE_AN_WidthStandards': CODE_AN_WidthStandardsSerializer,
    'CulvertCondition': CulvertConditionSerializer,
    'CulvertInventory': CulvertInventorySerializer,
    'Link': LinkSerializer,
    'RetainingWallCondition': RetainingWallConditionSerializer,
    'RetainingWallInventory': RetainingWallInventorySerializer,
    'RoadCondition': RoadConditionSerializer,
    'RoadInventory': RoadInventorySerializer,
    'TrafficVolume': TrafficVolumeSerializer,
    'FormData': FormDataSerializer
}

class UploadDataView(APIView):
    parser_classes = [CustomJSONParser]

    def post(self, request):
        try:
            data = clean_nan_values(request.data)
            results = {}
            validation_errors = {}

            for model_name, records in data.items():
                try:
                    # Skip if records is not a list
                    if not isinstance(records, list):
                        continue
                        
                    model = apps.get_model('db', model_name)
                    serializer_class = SERIALIZER_MAP.get(model_name)
                    if not serializer_class:
                        results[model_name] = {
                            'status': 'error',
                            'message': f'No serializer found for model {model_name}'
                        }
                        continue

                    processed_records = []
                    for record in records:
                        # Convert all keys to lowercase
                        record = {k.lower(): v for k, v in record.items()}
                        # Generate admin_code if needed
                        #record = generate_admin_code(record)

                        if 'province_code' in record and 'kabupaten_code' in record:
                            province_code = record['province_code']
                            kabupaten_code = record['kabupaten_code']
                            if province_code is not None and kabupaten_code is not None:
                                record['admin_code'] = int(f"{int(province_code)}{int(kabupaten_code):02d}")
                        processed_records.append(record)

                    objects = []
                    for i, record in enumerate(processed_records):
                        try:
                            # Check if record has an ID and if it exists in the database
                            record_id = record.get('id')
                            if record_id is not None:
                                try:
                                    existing_obj = model.objects.get(id=record_id)
                                    serializer = serializer_class(existing_obj, data=record, partial=True)
                                    if serializer.is_valid():
                                        obj = serializer.save()
                                        objects.append(obj)
                                    else:
                                        validation_errors[f"{model_name}_record_{i}"] = {
                                            'record': record,
                                            'errors': serializer.errors
                                        }
                                except model.DoesNotExist:
                                    # If record doesn't exist, create new one
                                    serializer = serializer_class(data=record)
                                    if serializer.is_valid():
                                        obj = serializer.save()
                                        objects.append(obj)
                                    else:
                                        validation_errors[f"{model_name}_record_{i}"] = {
                                            'record': record,
                                            'errors': serializer.errors
                                        }
                            else:
                                # If no ID provided, create new record
                                serializer = serializer_class(data=record)
                                if serializer.is_valid():
                                    obj = serializer.save()
                                    objects.append(obj)
                                else:
                                    validation_errors[f"{model_name}_record_{i}"] = {
                                        'record': record,
                                        'errors': serializer.errors
                                    }
                        except ValidationError as e:
                            validation_errors[f"{model_name}_record_{i}"] = {
                                'record': record,
                                'errors': str(e)
                            }

                    if validation_errors:
                        results[model_name] = {
                            'status': 'validation_error',
                            'errors': validation_errors
                        }
                    else:
                        results[model_name] = {
                            'status': 'validated',
                            'objects': serializer_class(objects, many=True).data
                        }

                except Exception as e:
                    results[model_name] = {
                        'status': 'error',
                        'message': str(e)
                    }

            has_validation_errors = any(result.get('status') == 'validation_error' for result in results.values())

            if has_validation_errors:
                return Response({
                    'status': 'validation_error',
                    'message': 'One or more records failed validation',
                    'details': results
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response(results, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
