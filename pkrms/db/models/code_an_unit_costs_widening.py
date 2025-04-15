from django.db import models

class CODE_AN_UnitCostsWidening(models.Model):
    id = models.AutoField(primary_key=True,db_column='id')
    admin_code = models.IntegerField(null=True, blank=True,db_column='adminCode')
    cumesa1 = models.FloatField(null=True, blank=True, db_column='cumesa1')
    cumesa2 = models.FloatField(null=True, blank=True, db_column='cumesa2')
    wideningsealed_unitcost = models.FloatField(null=True, blank=True, db_column='wideningSealedUnitcost')
    wideningunsealed_unitcost = models.FloatField(null=True, blank=True, db_column='wideningUnsealedUnitcost')

    def __str__(self):
        return f"{self.admin_code}"
    
    class Meta:
        db_table = 'code_an_unitcostswidening'
        verbose_name = 'Code An Unitcostswidening'
        verbose_name_plural = 'Code An Unitcostswidenings'
